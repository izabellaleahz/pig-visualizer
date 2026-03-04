#!/usr/bin/env python3
"""
Transform combined pig tile library data into JSON for the web visualizer.

Reads from jim/output_paired/ and outputs to public/data/.
Supports both the combined library (step 5) and the final library (step 7)
which includes SLA and HLA tiles.

Categories (pig tiles):
- unique: no human homolog (pig-only clusters)
- unique_with_homolog: has homolog but alignment failed
- divergent: <80% identity to human
- similar: 80-99% identity to human
- sla: SLA (swine leukocyte antigen) allele tiles
- (excluded): 100% identical to human

Categories (human tiles):
- human_ortholog: paired ortholog tile from general pipeline
- hla: HLA allele tile from IMGT/HLA
"""

import json
import math
import pickle
import re
from collections import defaultdict
from pathlib import Path

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
JIM_DIR = PROJECT_ROOT / "jim"
# Prefer final library (step 7) if available, fall back to combined (step 5)
INPUT_TILES_FINAL = JIM_DIR / "output_paired" / "final_tiles.pkl"
INPUT_TILES_COMBINED = JIM_DIR / "output_paired" / "combined_tiles.pkl"
INPUT_STATS_FINAL = JIM_DIR / "output_paired" / "final_stats.json"
INPUT_STATS_COMBINED = JIM_DIR / "output_paired" / "combined_stats.json"
MHC_STATS = JIM_DIR / "output_paired" / "mhc_stats.json"
SLA_STATS = JIM_DIR / "output_paired" / "sla_stats.json"  # legacy fallback
PIG_FASTA = JIM_DIR / "data" / "GCF_000003025.6_Sscrofa11.1_protein.faa"
HUMAN_FASTA = JIM_DIR / "data" / "GCF_000001405.40_GRCh38.p14_protein.faa"
OUTPUT_DIR = Path(__file__).parent / "public" / "data"


def load_protein_annotations(fasta_path, species_bracket):
    """Load protein names and descriptions from RefSeq FASTA headers.

    Args:
        fasta_path: Path to the FASTA file
        species_bracket: Species name as it appears in brackets, e.g., 'Sus scrofa' or 'Homo sapiens'
    """
    print(f"Loading protein annotations from {fasta_path}...")
    annotations = {}

    if not fasta_path.exists():
        print(f"  Warning: {fasta_path} not found. Using accession IDs as names.")
        return annotations

    # Parse FASTA headers: >ACCESSION DESCRIPTION [SPECIES]
    # Example: >XP_020919091.1 dynein heavy chain 11, axonemal isoform X4 [Sus scrofa]
    header_pattern = re.compile(rf'^>(\S+)\s+(.+?)\s*\[{re.escape(species_bracket)}\]')

    with open(fasta_path, 'r') as f:
        for line in f:
            if line.startswith('>'):
                match = header_pattern.match(line)
                if match:
                    accession = match.group(1)
                    description = match.group(2).strip()
                    # Clean up description - remove "isoform X1" etc. for display
                    name_clean = re.sub(r'\s+isoform\s+X?\d+$', '', description)
                    name_clean = re.sub(r'\s+isoform\s+[a-z]+\s+precursor$', ' precursor', name_clean)
                    name_clean = re.sub(r'\s+precursor$', '', name_clean)
                    annotations[accession] = {
                        'description': description,
                        'name_clean': name_clean,
                    }

    print(f"  Loaded annotations for {len(annotations):,} proteins")
    return annotations


def load_tiles():
    """Load tiles from final_tiles.pkl (step 7) or combined_tiles.pkl (step 5).

    Returns (pig_tiles, human_tiles) tuple.
    Handles both old format (list) and new format (dict with pig_tiles/human_tiles).
    """
    if INPUT_TILES_FINAL.exists():
        input_path = INPUT_TILES_FINAL
    elif INPUT_TILES_COMBINED.exists():
        input_path = INPUT_TILES_COMBINED
    else:
        print(f"Error: neither {INPUT_TILES_FINAL} nor {INPUT_TILES_COMBINED} found.")
        return [], []

    print(f"Loading tiles from {input_path}...")
    with open(input_path, "rb") as f:
        data = pickle.load(f)

    # Handle both formats
    if isinstance(data, dict):
        pig_tiles = data.get("pig_tiles", [])
        human_tiles = data.get("human_tiles", [])
    else:
        # Legacy format: list of pig tiles only
        pig_tiles = data
        human_tiles = []

    print(f"  Loaded {len(pig_tiles):,} pig tiles, {len(human_tiles):,} human tiles")
    return pig_tiles, human_tiles


def load_stats():
    """Load comparison stats from final or combined stats."""
    for stats_path in [INPUT_STATS_FINAL, INPUT_STATS_COMBINED]:
        if stats_path.exists():
            with open(stats_path, "r") as f:
                return json.load(f)
    return {}


def load_mhc_stats():
    """Load MHC stats (SLA + HLA) if available."""
    for path in [MHC_STATS, SLA_STATS]:
        if path.exists():
            with open(path, "r") as f:
                return json.load(f)
    return {}


def transform_data():
    """Transform combined tile library data into visualizer format."""
    print("=" * 60)
    print("TRANSFORMING COMBINED PIG TILE LIBRARY DATA")
    print("=" * 60)

    pig_tiles, human_tiles = load_tiles()
    stats = load_stats()
    mhc_stats = load_mhc_stats()
    pig_annotations = load_protein_annotations(PIG_FASTA, "Sus scrofa")
    human_annotations = load_protein_annotations(HUMAN_FASTA, "Homo sapiens")

    if not pig_tiles:
        print("No tiles found. Exiting.")
        return

    print(f"\nStats summary:")
    print(f"  Pig tiles: {stats.get('pig_tile_count', len(pig_tiles)):,}")
    print(f"  Human tiles: {stats.get('human_tile_count', len(human_tiles)):,}")
    print(f"  Pig categories: {stats.get('pig_categories', stats.get('categories', {}))}")

    # Group tiles by pig protein
    tiles_by_protein = defaultdict(list)

    print("\nGrouping tiles by pig protein...")
    for tile in pig_tiles:
        for source in tile.get("pig_sources", []):
            protein_id = source["protein_id"]
            tiles_by_protein[protein_id].append({
                "tile": tile,
                "start": source["start"],
                "end": source["end"],
            })

    print(f"  Found {len(tiles_by_protein):,} unique pig proteins")

    # Build protein data
    pig_proteins = []

    # Category colors for visualization
    category_colors = {
        "unique": "#dc2626",           # red - no human homolog (best for rejection)
        "unique_with_homolog": "#f97316",  # orange - has homolog but no alignment
        "divergent": "#eab308",         # yellow - <80% identity
        "similar": "#22c55e",           # green - 80-99% identity
        "sla": "#8b5cf6",              # purple - SLA allele tiles
        "hla": "#3b82f6",             # blue - HLA allele tiles (human MHC)
        "human_ortholog": "#06b6d4",   # cyan - human ortholog tiles
    }

    print("\nBuilding protein data...")
    for protein_id, protein_tiles in tiles_by_protein.items():
        # Determine sequence length from tile positions
        if protein_tiles:
            max_end = max(t["end"] for t in protein_tiles)
            length = max_end
        else:
            length = 0

        # Count tile categories
        category_counts = defaultdict(int)
        for pt in protein_tiles:
            cat = pt["tile"].get("category", "unknown")
            category_counts[cat] += 1

        # Calculate coverage
        covered = set()
        for pt in protein_tiles:
            for pos in range(pt["start"], pt["end"]):
                covered.add(pos)

        coverage_pct = round(100.0 * len(covered) / length, 1) if length > 0 else 0
        coverage_start = min(covered) if covered else 0
        coverage_end = max(covered) if covered else 0

        # Build tile positions for this protein
        tile_positions = []
        for pt in protein_tiles:
            tile_data = pt["tile"]
            category = tile_data.get("category", "unknown")

            # Get identity info
            max_identity = tile_data.get("max_identity")
            human_matches = tile_data.get("human_matches", [])

            # Build human matches with names
            human_matches_with_names = []
            for m in human_matches[:3]:  # Limit to top 3 for display
                # Support both paired tile format and SLA BLAST hit format
                human_protein_id = m.get("protein_id", m.get("human_protein", ""))
                human_annot = human_annotations.get(human_protein_id, {})
                human_matches_with_names.append({
                    "proteinId": human_protein_id,
                    "name": human_annot.get("name_clean", human_protein_id),
                    "tile": m.get("tile", ""),
                    "identity": m.get("identity", 0),
                })

            tile_positions.append({
                "id": tile_data.get("tile_id", ""),
                "start": pt["start"],
                "end": pt["end"],
                "category": category,
                "seq": tile_data.get("pig_tile", ""),
                "maxIdentity": max_identity,
                "humanMatchCount": len(human_matches),
                "humanMatches": human_matches_with_names,
            })

        # Sort tiles by position
        tile_positions.sort(key=lambda t: t["start"])

        # Get human-readable name from annotations
        annotation = pig_annotations.get(protein_id, {})
        description = annotation.get('description', protein_id)
        name_clean = annotation.get('name_clean', protein_id)

        # Build external links
        # NCBI Protein link
        ncbi_link = f"https://www.ncbi.nlm.nih.gov/protein/{protein_id}"
        # UniProt search link (searches by NCBI accession)
        uniprot_link = f"https://www.uniprot.org/uniprotkb?query={protein_id}"

        protein_data = {
            "id": protein_id,
            "species": "pig",
            "name": description,  # Full description with isoform info
            "nameClean": name_clean,  # Cleaned name without isoform
            "length": length,
            "tileCount": len(protein_tiles),
            "uniqueTiles": category_counts.get("unique", 0),
            "uniqueWithHomologTiles": category_counts.get("unique_with_homolog", 0),
            "divergentTiles": category_counts.get("divergent", 0),
            "similarTiles": category_counts.get("similar", 0),
            "slaTiles": category_counts.get("sla", 0),
            "coveragePct": min(100.0, coverage_pct),
            "coverageStart": coverage_start,
            "coverageEnd": coverage_end,
            "ncbiLink": ncbi_link,
            "uniprotLink": uniprot_link,
            "tiles": tile_positions,
        }

        pig_proteins.append(protein_data)

    # Sort proteins by unique tile count (most interesting first)
    pig_proteins.sort(key=lambda p: (p["uniqueTiles"] + p["divergentTiles"]), reverse=True)

    print(f"  Pig proteins: {len(pig_proteins):,}")

    # Build species summary
    species_data = [
        {
            "id": "pig",
            "name": "Pig (Sus scrofa)",
            "proteinCount": len(pig_proteins),
            "tileCount": sum(p["tileCount"] for p in pig_proteins),
            "uniqueTiles": sum(p["uniqueTiles"] for p in pig_proteins),
            "uniqueWithHomologTiles": sum(p["uniqueWithHomologTiles"] for p in pig_proteins),
            "divergentTiles": sum(p["divergentTiles"] for p in pig_proteins),
            "similarTiles": sum(p["similarTiles"] for p in pig_proteins),
            "slaTiles": sum(p["slaTiles"] for p in pig_proteins),
        },
    ]

    # Build statistics for the visualizer
    categories = stats.get("pig_categories", stats.get("categories", {}))
    human_categories = stats.get("human_categories", {})
    statistics = {
        "library_summary": {
            "total_sequences": stats.get("final_tile_count", len(pig_tiles) + len(human_tiles)),
            "total_pig_tiles": stats.get("pig_tile_count", len(pig_tiles)),
            "total_human_tiles": stats.get("human_tile_count", len(human_tiles)),
            "unique_tiles": categories.get("unique", 0),
            "unique_with_homolog_tiles": categories.get("unique_with_homolog", 0),
            "divergent_tiles": categories.get("divergent", 0),
            "similar_tiles": categories.get("similar", 0),
            "sla_tiles": categories.get("sla", 0),
            "human_ortholog_tiles": human_categories.get("human_ortholog", 0),
            "hla_tiles": human_categories.get("hla", 0),
            "excluded_identical": stats.get("excluded_identical", 0),
            "pig_proteins": stats.get("pig_proteins_covered", len(pig_proteins)),
            "human_proteins": stats.get("human_orthologs", {}).get(
                "total_unique_human_tiles", len(human_tiles)),
        },
        "identity_stats": stats.get("identity_stats", {}),
        "coverage": {
            "proteins_with_full_coverage": sum(1 for p in pig_proteins if p["coveragePct"] >= 100),
            "proteins_with_partial_coverage": sum(1 for p in pig_proteins if p["coveragePct"] < 100),
            "mean_coverage_pct": round(
                sum(p["coveragePct"] for p in pig_proteins) / len(pig_proteins), 1
            ) if pig_proteins else 0,
        },
        "mhc": mhc_stats if mhc_stats else {},
        "generation_info": {
            "pipeline": "Pig Rejection PhIP-seq Library (Alignment-based + MHC)",
            "tile_length": stats.get("tile_parameters", {}).get("tile_length", 49),
            "tile_overlap": stats.get("tile_parameters", {}).get("tile_overlap", 25),
            "clustering_threshold": 0.8,
            "pig_only_collapse_threshold": 0.95,
            "method": "CD-HIT clustering → MAFFT alignment → identity pairing + SLA/HLA MHC tiling",
        },
    }

    # Build search index with human-readable names
    search_index = {
        "species": [
            {"id": "pig", "name": "Pig (Sus scrofa)"},
            {"id": "sla", "name": "SLA Alleles (Swine Leukocyte Antigen)"},
            {"id": "hla", "name": "HLA Alleles (Human Leukocyte Antigen)"},
        ],
        "proteins": [
            {"id": p["id"], "name": p["nameClean"], "species": "pig"}
            for p in pig_proteins
        ],
    }

    # Write output files (compact format to reduce size for GitHub Pages)
    # The frontend api.ts decodes compact keys back to full TypeScript types
    print("\nWriting output files (compact format)...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "proteins").mkdir(exist_ok=True)
    (OUTPUT_DIR / "proteins" / "pig").mkdir(exist_ok=True)

    # Category short codes for compact tile arrays
    CAT_SHORT = {
        "unique": "u",
        "unique_with_homolog": "uh",
        "divergent": "d",
        "similar": "s",
        "sla": "sla",
        "hla": "hla",
        "human_ortholog": "ho",
    }

    def compact_protein(p):
        """Convert protein to compact format with short keys and array tiles.

        Compact tile format: [start, end, category_code, seq, ?matches]
        where matches = [[proteinId, name, identity], ...]
        Fields like ncbiLink/uniprotLink are constructed client-side from the ID.
        """
        compact_tiles = []
        for t in p.get("tiles", []):
            cat = CAT_SHORT.get(t["category"], t["category"])
            entry = [t["start"], t["end"], cat, t["seq"]]
            if t.get("humanMatches"):
                matches = [
                    [m["proteinId"], m.get("name", ""), round(m["identity"], 4)]
                    for m in t["humanMatches"]
                ]
                entry.append(matches)
            compact_tiles.append(entry)

        return {
            "n": p.get("nameClean", p.get("name", "")),
            "l": p["length"],
            "tc": p["tileCount"],
            "ut": p["uniqueTiles"],
            "uwh": p.get("uniqueWithHomologTiles", 0),
            "dt": p["divergentTiles"],
            "st": p["similarTiles"],
            "sla": p.get("slaTiles", 0),
            "cp": p["coveragePct"],
            "t": compact_tiles,
        }

    def compact_summary(p):
        """Convert protein to compact summary format (no tiles)."""
        return {
            "i": p["id"],
            "n": p.get("nameClean", p.get("name", "")),
            "l": p["length"],
            "tc": p["tileCount"],
            "ut": p["uniqueTiles"],
            "uwh": p.get("uniqueWithHomologTiles", 0),
            "dt": p["divergentTiles"],
            "st": p["similarTiles"],
            "sla": p.get("slaTiles", 0),
            "cp": p["coveragePct"],
        }

    # Species summary
    with open(OUTPUT_DIR / "species.json", "w") as f:
        json.dump(species_data, f, indent=2)
    print(f"  species.json ({len(species_data)} species)")

    # Pig proteins summary (compact format for fast loading)
    pig_summary = [compact_summary(p) for p in pig_proteins]
    with open(OUTPUT_DIR / "proteins" / "pig-summary.json", "w") as f:
        json.dump(pig_summary, f, separators=(',', ':'))
    summary_size = (OUTPUT_DIR / "proteins" / "pig-summary.json").stat().st_size
    print(f"  proteins/pig-summary.json ({len(pig_summary):,} proteins, {summary_size/1024/1024:.1f} MB)")

    # Chunked protein files (compact format for detail view)
    CHUNK_SIZE = 100
    num_chunks = math.ceil(len(pig_proteins) / CHUNK_SIZE)
    chunk_index = {}  # protein_id -> chunk number
    total_chunk_bytes = 0

    print(f"  Writing {num_chunks:,} chunk files ({CHUNK_SIZE} proteins each)...")
    for chunk_num in range(num_chunks):
        start = chunk_num * CHUNK_SIZE
        end = min(start + CHUNK_SIZE, len(pig_proteins))
        chunk_proteins = pig_proteins[start:end]

        chunk_dict = {}
        for protein in chunk_proteins:
            chunk_dict[protein["id"]] = compact_protein(protein)
            chunk_index[protein["id"]] = chunk_num

        chunk_path = OUTPUT_DIR / "proteins" / "pig" / f"chunk-{chunk_num:04d}.json"
        with open(chunk_path, "w") as f:
            json.dump(chunk_dict, f, separators=(',', ':'))
        total_chunk_bytes += chunk_path.stat().st_size

    # Chunk index: maps protein ID -> chunk number
    with open(OUTPUT_DIR / "proteins" / "pig" / "chunk-index.json", "w") as f:
        json.dump(chunk_index, f, separators=(',', ':'))
    print(f"  proteins/pig/chunk-index.json ({len(chunk_index):,} mappings)")
    print(f"  proteins/pig/chunk-*.json ({num_chunks:,} chunks, {total_chunk_bytes/1024/1024:.1f} MB)")

    # Protein lookup
    protein_lookup = {p["id"]: "pig" for p in pig_proteins}
    with open(OUTPUT_DIR / "proteins" / "lookup.json", "w") as f:
        json.dump(protein_lookup, f)
    print(f"  proteins/lookup.json ({len(protein_lookup):,} mappings)")

    # Statistics
    with open(OUTPUT_DIR / "statistics.json", "w") as f:
        json.dump(statistics, f, indent=2)
    print(f"  statistics.json")

    # Search index
    with open(OUTPUT_DIR / "search-index.json", "w") as f:
        json.dump(search_index, f)
    print(f"  search-index.json ({len(search_index['proteins']):,} proteins)")

    print("\n" + "=" * 60)
    print("TRANSFORMATION COMPLETE!")
    print("=" * 60)
    print(f"\n  Pig proteins: {len(pig_proteins):,}")
    print(f"  Pig tiles: {len(pig_tiles):,}")
    print(f"  Human tiles: {len(human_tiles):,}")
    print(f"\n  Pig categories:")
    print(f"    Unique (no homolog): {categories.get('unique', 0):,}")
    print(f"    Unique with homolog: {categories.get('unique_with_homolog', 0):,}")
    print(f"    Divergent (<80%): {categories.get('divergent', 0):,}")
    print(f"    Similar (80-99%): {categories.get('similar', 0):,}")
    print(f"    SLA alleles: {categories.get('sla', 0):,}")
    print(f"  Human categories:")
    print(f"    Orthologs: {human_categories.get('human_ortholog', 0):,}")
    print(f"    HLA: {human_categories.get('hla', 0):,}")
    print(f"\n  Output directory: {OUTPUT_DIR}")


if __name__ == "__main__":
    transform_data()
