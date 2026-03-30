export type TileCategory = 'unique' | 'unique_with_homolog' | 'divergent' | 'similar' | 'sla' | 'hla' | 'human_ortholog';
export type SpeciesId = 'pig' | 'human';

export interface HumanMatch {
  proteinId: string;
  name?: string;       // Gene symbol (e.g., PKD1)
  description?: string; // Full protein name (e.g., Polycystin-1)
  tile: string;
  identity: number;
}

export interface TilePosition {
  id: string;
  start: number;
  end: number;
  category: TileCategory;
  seq: string;
  maxIdentity?: number | null;
  humanMatchCount?: number;
  humanMatches?: HumanMatch[];
  sharedGeneCount?: number;  // number of genes sharing this tile (>1 = shared)
}

export interface Protein {
  id: string;
  species: SpeciesId;
  name: string;
  nameClean: string;
  length: number;
  tileCount: number;
  uniqueTiles: number;
  uniqueWithHomologTiles: number;
  divergentTiles: number;
  similarTiles: number;
  slaTiles: number;
  coveragePct: number;
  coverageStart: number;
  coverageEnd: number;
  isoformCount: number;
  isoformIds: string[];
  ncbiLink?: string;
  uniprotLink?: string;
  tiles?: TilePosition[];
  sequence?: string;
}

// Protein without tiles (for listing views)
export type ProteinSummary = Omit<Protein, 'tiles' | 'sequence'> & {
  tiles?: TilePosition[];
};

export interface Species {
  id: SpeciesId;
  name: string;
  proteinCount: number;
  tileCount: number;
  uniqueTiles: number;
  uniqueWithHomologTiles: number;
  divergentTiles: number;
  similarTiles: number;
  slaTiles: number;
}

export interface SearchIndex {
  species: { id: string; name: string }[];
  proteins: { id: string; name: string; species: SpeciesId }[];
}

// ---- MHC types ----

export interface MhcLocus {
  id: string;
  name: string;
  ortholog: string | null;
  class: 'I' | 'II' | 'unknown';
  alleleCount: number;
  tileCount: number;
  pairedTiles: number;
  meanIdentity: number | null;
  hlaAlleleCount: number;
  hlaTileCount: number;
}

export interface MhcAllele {
  id: string;
  name: string;
  source: string;
  uniprot?: string | null;
  frequency?: number;
  rank?: number;
  length: number;
  tileCount: number;
  pairedCount?: number;
  meanIdentity?: number | null;
  tiles: MhcTileCompact[];
}

// SLA tile: [start, end, seq, identity, hlaMatch, hlaTileSeq]
// HLA tile: [start, end, seq]
export type MhcTileCompact = (string | number | null)[];

export interface MhcLocusDetail {
  id: string;
  name: string;
  ortholog: string | null;
  class: 'I' | 'II' | 'unknown';
  alleleCount: number;
  tileCount: number;
  pairedTiles: number;
  meanIdentity: number | null;
  hlaAlleleCount: number;
  hlaTileCount: number;
  slaAlleles: MhcAllele[];
  hlaAlleles: MhcAllele[];
}

export interface MhcPairCompact {
  sl: string;  // sla locus
  hl: string;  // hla locus
  sa: string;  // sla allele
  ha: string;  // hla allele
  sp: string;  // sla protein
  pos: number; // position
  id: number;  // identity
  ss: string;  // sla seq
  hs: string;  // hla seq
  mm: number[]; // mismatches
  tid: string; // tile id
}

export interface MhcPairingData {
  pairs: MhcPairCompact[];
  identityDistribution: Record<string, number>;
  totalPairs: number;
  meanIdentity: number;
}

export interface MhcStatistics {
  pipeline: string;
  topNHla: number;
  hla: {
    targetAlleles: number;
    matchedAlleles: number;
    uniqueProteins: number;
    totalTiles: number;
    locusCounts: Record<string, number>;
    source: string;
    uniprotGenes: Record<string, string>;
    alleles: { name: string; locus: string; freq: number; rank: number }[];
  };
  sla: {
    rawAlleles: number;
    parsedAlleles: number;
    uniqueProteins: number;
    totalTiles: number;
    tilesWithHlaPair: number;
    meanIdentity: number;
    classDistribution: Record<string, number>;
    geneCounts: Record<string, number>;
    source: string;
  };
  pairing: {
    totalPairs: number;
    meanIdentity: number;
    paired: number;
    unpaired: number;
    orthologMap: Record<string, string>;
  };
  tileParams: { tile_length: number; tile_step: number };
  identityDistribution: Record<string, number>;
}

export interface MhcSearchIndex {
  loci: { id: string; name: string; ortholog: string | null; type: string }[];
  alleles: { id: string; name: string; locus: string; species: string; type: string; frequency?: number }[];
}

export interface LibraryStatistics {
  library_summary: {
    total_sequences: number;
    total_pig_tiles: number;
    total_human_tiles: number;
    unique_tiles: number;
    unique_with_homolog_tiles: number;
    divergent_tiles: number;
    similar_tiles: number;
    sla_tiles?: number;
    human_ortholog_tiles?: number;
    hla_tiles?: number;
    excluded_identical: number;
    pig_proteins: number;
    human_proteins: number;
  };
  identity_stats?: {
    tiles_with_human_match?: number;
    mean_identity?: number;
  };
  coverage: {
    proteins_with_full_coverage?: number;
    proteins_with_partial_coverage?: number;
    mean_coverage_pct?: number;
  };
  generation_info?: {
    pipeline?: string;
    tile_length?: number;
    tile_overlap?: number;
    clustering_threshold?: number;
    method?: string;
  };
}
