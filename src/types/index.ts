export type TileCategory = 'unique' | 'unique_with_homolog' | 'divergent' | 'similar' | 'sla' | 'hla' | 'human_ortholog';
export type SpeciesId = 'pig' | 'human';

export interface HumanMatch {
  proteinId: string;
  name?: string;  // Human-readable protein name
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
