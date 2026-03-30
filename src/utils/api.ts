import type { Species, Protein, ProteinSummary, SearchIndex, LibraryStatistics, SpeciesId, TilePosition, HumanMatch, TileCategory } from '../types';

// Handle both development and production paths
const BASE_URL = (import.meta.env.BASE_URL || '/') + 'data';

// Decode compact data format (short keys) back to full TypeScript types
// Category code mapping: compact -> full
const CAT_MAP: Record<string, TileCategory> = {
  u: 'unique',
  uh: 'unique_with_homolog',
  d: 'divergent',
  s: 'similar',
  sla: 'sla',
  hla: 'hla',
  ho: 'human_ortholog',
};

// Decode a compact tile array: [start, end, catCode, seq, ?matches]
// where matches = [[proteinId, name, identity], ...]
function decodeTile(arr: unknown[], index: number): TilePosition {
  const start = arr[0] as number;
  const end = arr[1] as number;
  const catCode = arr[2] as string;
  const seq = arr[3] as string;
  const rawMatches = arr[4] as [string, string, number][] | null | undefined;
  const sharedGeneCount = arr[5] as number | undefined;

  const humanMatches: HumanMatch[] = rawMatches
    ? rawMatches.map(([proteinId, name, identity]) => ({
        proteinId,
        name: name || proteinId,
        tile: '',
        identity,
      }))
    : [];

  return {
    id: `tile_${index}`,
    start,
    end,
    category: CAT_MAP[catCode] || (catCode as TileCategory),
    seq,
    maxIdentity: humanMatches.length > 0 ? Math.max(...humanMatches.map(m => m.identity)) : null,
    humanMatchCount: humanMatches.length,
    humanMatches,
    sharedGeneCount: sharedGeneCount && sharedGeneCount > 1 ? sharedGeneCount : undefined,
  };
}

// Decode a compact protein object back to full Protein type
interface CompactProtein {
  n: string;
  l: number;
  tc: number;
  ut: number;
  uwh: number;
  dt: number;
  st: number;
  sla: number;
  cp: number;
  t: unknown[][];
  ic?: number;    // isoformCount (only present if > 1)
  iids?: string[]; // other isoform IDs
}

function decodeProtein(id: string, c: CompactProtein | Record<string, unknown>): Protein {
  // Handle legacy format (full keys, cached from old version)
  if ('tiles' in c && Array.isArray((c as Record<string, unknown>).tiles)) {
    const legacy = c as unknown as Protein;
    return {
      ...legacy,
      id,
      isoformCount: legacy.isoformCount ?? 1,
      isoformIds: legacy.isoformIds ?? [],
      ncbiLink: legacy.ncbiLink || `https://www.ncbi.nlm.nih.gov/protein/${id}`,
      uniprotLink: legacy.uniprotLink || `https://www.uniprot.org/uniprotkb?query=${id}`,
    };
  }
  const compact = c as CompactProtein;
  const tiles: TilePosition[] = compact.t.map((arr, i) => decodeTile(arr, i));
  return {
    id,
    species: 'pig',
    name: compact.n,
    nameClean: compact.n,
    length: compact.l,
    tileCount: compact.tc,
    uniqueTiles: compact.ut,
    uniqueWithHomologTiles: compact.uwh,
    divergentTiles: compact.dt,
    similarTiles: compact.st,
    slaTiles: compact.sla,
    coveragePct: compact.cp,
    coverageStart: tiles.length > 0 ? tiles[0].start : 0,
    coverageEnd: tiles.length > 0 ? tiles[tiles.length - 1].end : 0,
    isoformCount: compact.ic ?? 1,
    isoformIds: compact.iids ?? [],
    ncbiLink: `https://www.ncbi.nlm.nih.gov/protein/${id}`,
    uniprotLink: `https://www.uniprot.org/uniprotkb?query=${id}`,
    tiles,
  };
}

// Decode a compact summary entry back to ProteinSummary
interface CompactSummary {
  i: string;
  n: string;
  l: number;
  tc: number;
  ut: number;
  uwh: number;
  dt: number;
  st: number;
  sla: number;
  cp: number;
  ic?: number; // isoformCount (only present if > 1)
}

function decodeSummary(c: CompactSummary | Record<string, unknown>): ProteinSummary {
  // Handle both compact format (short keys) and legacy format (full keys)
  if ('id' in c && typeof (c as Record<string, unknown>).id === 'string') {
    // Legacy format — return as-is with defaults
    const legacy = c as unknown as ProteinSummary;
    return {
      ...legacy,
      uniqueWithHomologTiles: legacy.uniqueWithHomologTiles ?? 0,
      coverageStart: legacy.coverageStart ?? 0,
      coverageEnd: legacy.coverageEnd ?? 0,
      isoformCount: legacy.isoformCount ?? 1,
      isoformIds: legacy.isoformIds ?? [],
    };
  }
  const compact = c as CompactSummary;
  return {
    id: compact.i,
    species: 'pig',
    name: compact.n,
    nameClean: compact.n,
    length: compact.l,
    tileCount: compact.tc,
    uniqueTiles: compact.ut,
    uniqueWithHomologTiles: compact.uwh,
    divergentTiles: compact.dt,
    similarTiles: compact.st,
    slaTiles: compact.sla,
    coveragePct: compact.cp,
    coverageStart: 0,
    coverageEnd: 0,
    isoformCount: compact.ic ?? 1,
    isoformIds: [],
  };
}

// In-memory cache for current session
const memoryCache: Record<string, unknown> = {};

// IndexedDB for persistent caching across sessions
const DB_NAME = 'pig-visualizer-cache';
const DB_VERSION = 2; // Bumped to invalidate stale cache from pre-compact format
const STORE_NAME = 'json-cache';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'path' });
      }
    };
  });

  return dbPromise;
}

async function getFromIndexedDB<T>(path: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(path);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(result.data as T);
        } else {
          resolve(null);
        }
      };
    });
  } catch {
    return null;
  }
}

async function saveToIndexedDB<T>(path: string, data: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ path, data, timestamp: Date.now() });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch {
    // Ignore IndexedDB errors - fall back to network
  }
}

// Chunk index: maps protein ID -> chunk number
let chunkIndexPromise: Promise<Record<string, number>> | null = null;

function getChunkIndex(): Promise<Record<string, number>> {
  if (!chunkIndexPromise) {
    chunkIndexPromise = fetchJson<Record<string, number>>('proteins/pig/chunk-index.json');
  }
  return chunkIndexPromise;
}

// Progress callback type
export type ProgressCallback = (loaded: number, total: number) => void;

async function fetchJson<T>(path: string, onProgress?: ProgressCallback): Promise<T> {
  // Check memory cache first (instant)
  if (memoryCache[path]) {
    return memoryCache[path] as T;
  }

  // Check IndexedDB cache (very fast, local)
  const cached = await getFromIndexedDB<T>(path);
  if (cached) {
    memoryCache[path] = cached;
    return cached;
  }

  // Normalize path - remove leading slash if present
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = `${BASE_URL}/${normalizedPath}`.replace(/\/+/g, '/');

  let response: Response;
  try {
    response = await fetch(url);
  } catch (e) {
    throw new Error(
      `Network error fetching ${path} from ${url}: ${e instanceof Error ? e.message : String(e)}. ` +
      `Check that the file exists in public/data/.`
    );
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `Failed to fetch ${path} (${response.status} ${response.statusText}) from ${url}. ` +
      `Response: ${errorText.substring(0, 200)}`
    );
  }

  // Stream the response with progress
  let text: string;
  if (onProgress && response.body) {
    const reader = response.body.getReader();
    const contentLength = parseInt(response.headers.get('Content-Length') || '0', 10);
    let receivedLength = 0;
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedLength += value.length;
      onProgress(receivedLength, contentLength || receivedLength * 2);
    }

    const allChunks = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
      allChunks.set(chunk, position);
      position += chunk.length;
    }

    text = new TextDecoder('utf-8').decode(allChunks);
  } else {
    text = await response.text();
  }

  try {
    const data = JSON.parse(text);
    memoryCache[path] = data;

    // Save to IndexedDB for next visit (don't await - do it in background)
    saveToIndexedDB(path, data);

    return data as T;
  } catch (e) {
    throw new Error(
      `Failed to parse JSON from ${path}: ${e instanceof Error ? e.message : String(e)}. ` +
      `First 200 chars: ${text.substring(0, 200)}`
    );
  }
}

export async function fetchSpecies(): Promise<Species[]> {
  return fetchJson<Species[]>('species.json');
}

// Fetch protein summaries (without tiles) for listing - uses small summary files
export async function fetchSpeciesProteins(speciesId: SpeciesId, onProgress?: ProgressCallback): Promise<ProteinSummary[]> {
  const raw = await fetchJson<CompactSummary[]>(`proteins/${speciesId}-summary.json`, onProgress);
  return raw.map(decodeSummary);
}

// Fetch full protein details (with tiles) - loads from chunked files
export async function fetchProteinDetails(speciesId: SpeciesId, proteinId: string): Promise<Protein> {
  const chunkIndex = await getChunkIndex();
  const chunkNum = chunkIndex[proteinId];

  if (chunkNum === undefined) {
    throw new Error(`Protein ${proteinId} not found in chunk index`);
  }

  const chunkPath = `proteins/${speciesId}/chunk-${String(chunkNum).padStart(4, '0')}.json`;
  const chunkData = await fetchJson<Record<string, CompactProtein>>(chunkPath);
  const compact = chunkData[proteinId];

  if (!compact) {
    throw new Error(`Protein ${proteinId} not found in chunk ${chunkNum}`);
  }

  return decodeProtein(proteinId, compact);
}

export async function fetchProteinLookup(): Promise<Record<string, SpeciesId>> {
  return fetchJson<Record<string, SpeciesId>>('proteins/lookup.json');
}

export async function fetchSearchIndex(): Promise<SearchIndex> {
  return fetchJson<SearchIndex>('search-index.json');
}

export async function fetchStatistics(): Promise<LibraryStatistics> {
  return fetchJson<LibraryStatistics>('statistics.json');
}

// Isoform redirect map: isoform_id → representative_id
let isoformRedirectPromise: Promise<Record<string, string>> | null = null;

function getIsoformRedirect(): Promise<Record<string, string>> {
  if (!isoformRedirectPromise) {
    isoformRedirectPromise = fetchJson<Record<string, string>>('proteins/isoform-redirect.json')
      .catch(() => ({})); // gracefully handle missing file
  }
  return isoformRedirectPromise;
}

// Resolve a protein ID to its representative (if it's a collapsed isoform)
export async function resolveProteinId(proteinId: string): Promise<string> {
  const redirect = await getIsoformRedirect();
  return redirect[proteinId] || proteinId;
}

// Helper to find a protein by ID - now loads individual protein file
export async function findProteinById(proteinId: string): Promise<{ protein: Protein; speciesId: SpeciesId } | null> {
  const lookup = await fetchProteinLookup();
  const speciesId = lookup[proteinId];

  if (!speciesId) {
    return null;
  }

  // Resolve isoform redirects
  const resolvedId = await resolveProteinId(proteinId);

  try {
    const protein = await fetchProteinDetails(speciesId, resolvedId);
    return { protein, speciesId };
  } catch (e) {
    console.error(`Failed to load protein ${proteinId}:`, e);
    return null;
  }
}

// ---- MHC data fetching ----

import type { MhcLocus, MhcLocusDetail, MhcPairingData, MhcStatistics, MhcSearchIndex } from '../types';

export async function fetchMhcSummary(): Promise<MhcLocus[]> {
  return fetchJson<MhcLocus[]>('mhc/mhc-summary.json');
}

export async function fetchMhcLocus(locusId: string): Promise<MhcLocusDetail> {
  return fetchJson<MhcLocusDetail>(`mhc/loci/${locusId}.json`);
}

export async function fetchMhcPairing(): Promise<MhcPairingData> {
  return fetchJson<MhcPairingData>('mhc/pairing.json');
}

export async function fetchMhcStatistics(): Promise<MhcStatistics> {
  return fetchJson<MhcStatistics>('mhc/mhc-statistics.json');
}

export async function fetchMhcSearchIndex(): Promise<MhcSearchIndex> {
  return fetchJson<MhcSearchIndex>('mhc/mhc-search-index.json');
}

// Preload data in background (call on app startup)
export function preloadData(): void {
  // Preload the pig summary in background
  fetchSpeciesProteins('pig').catch(() => {});
  fetchProteinLookup().catch(() => {});
  fetchSearchIndex().catch(() => {});
  getChunkIndex().catch(() => {});
  getIsoformRedirect().catch(() => {});
}
