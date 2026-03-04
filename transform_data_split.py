#!/usr/bin/env python3
"""
Transform pig vs human tile comparison data into split JSON for the web visualizer.
Creates small summary files + individual protein files to work within Vercel's limits.

Output structure:
  public/data/
    species.json           - Species summary
    statistics.json        - Library statistics
    search-index.json      - Search index
    proteins/
      lookup.json          - protein_id -> species mapping
      pig-summary.json     - Pig proteins metadata (no tiles)
      human-summary.json   - Human proteins metadata (no tiles)
      pig/                 - Individual pig protein files
        XP_xxx.json
      human/               - Individual human protein files
        NP_xxx.json
"""

import json
import os
from collections import defaultdict
from pathlib import Path
from urllib.parse import quote

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
JIM_DIR = PROJECT_ROOT / "jim"
INPUT_TILES = JIM_DIR / "output_array" / "all_tiles.json"
INPUT_STATS = JIM_DIR / "output_array" / "comparison_stats.json"
OUTPUT_DIR = Path(__file__).parent / "public" / "data"


def safe_filename(protein_id: str) -> str:
    """Convert protein ID to safe filename."""
    return protein_id.replace("/", "_").replace("\\", "_")


def load_tiles():
    """Load tiles from all_tiles.json."""
    print(f"Loading tiles from {INPUT_TILES}...")
    if not INPUT_TILES.exists():
        print(f"Error: {INPUT_TILES} not found.")
        return []

    with open(INPUT_TILES, "r") as f:
        tiles = json.load(f)
    print(f"  Loaded {len(tiles):,} tiles")
    return tiles


def load_stats():
    """Load comparison stats."""
    if not INPUT_STATS.exists():
        return {}

    with open(INPUT_STATS, "r") as f:
        return json.load(f)


def transform_data():
    """Transform tile comparison data into split visualizer format."""
    print("=" * 60)
    print("TRANSFORMING PIG VS HUMAN TILE DATA (SPLIT FORMAT)")
    print("=" * 60)

    tiles = load_tiles()
    stats = load_stats()

    if not tiles:
        print("No tiles found. Exiting.")
        return

    print(f"  Stats: {stats}")

    # Group tiles by protein
    tiles_by_protein = defaultdict(list)
    protein_species_map = {}

    print("\nGrouping tiles by protein...")
    for tile in tiles:
        for pig_prot in tile.get("pig_proteins", []):
            tiles_by_protein[pig_prot].append(tile)
            if pig_prot not in protein_species_map:
                protein_species_map[pig_prot] = "pig"

        for human_prot in tile.get("human_proteins", []):
            tiles_by_protein[human_prot].append(tile)
            if human_prot not in protein_species_map:
                protein_species_map[human_prot] = "human"

    print(f"  Found {len(tiles_by_protein):,} unique proteins")

    # Create output directories
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "proteins").mkdir(exist_ok=True)
    (OUTPUT_DIR / "proteins" / "pig").mkdir(exist_ok=True)
    (OUTPUT_DIR / "proteins" / "human").mkdir(exist_ok=True)

    # Build protein data
    pig_summaries = []
    human_summaries = []
    protein_lookup = {}

    print("\nBuilding protein data and writing individual files...")
    proteins_written = 0

    for protein_id, protein_tiles in tiles_by_protein.items():
        species = protein_species_map.get(protein_id, "unknown")

        # Determine sequence length from tile positions
        if protein_tiles:
            max_end = max(t.get("end_pos", 0) for t in protein_tiles)
            length = max_end + 1
        else:
            length = 0

        # Count tile types
        pig_only_count = sum(1 for t in protein_tiles if t.get("is_pig_only", False))
        human_only_count = sum(1 for t in protein_tiles if t.get("is_human_only", False))
        shared_count = sum(1 for t in protein_tiles if t.get("is_shared", False))

        # Calculate coverage
        covered = set()
        for tile in protein_tiles:
            start = tile.get("start_pos", 0)
            end = tile.get("end_pos", 0)
            for pos in range(start, end + 1):
                covered.add(pos)

        coverage_pct = round(100.0 * len(covered) / length, 1) if length > 0 else 0
        coverage_start = min(covered) if covered else 0
        coverage_end = max(covered) if covered else 0

        # Build tile positions for this protein
        tile_positions = []
        for tile in protein_tiles:
            if tile.get("is_pig_only", False):
                species_type = "pig_only"
            elif tile.get("is_human_only", False):
                species_type = "human_only"
            else:
                species_type = "shared"

            tile_positions.append({
                "id": tile.get("id", ""),
                "start": tile.get("start_pos", 0),
                "end": tile.get("end_pos", 0),
                "speciesType": species_type,
                "seq": tile.get("sequence", ""),
            })

        tile_positions.sort(key=lambda t: t["start"])

        # Summary data (no tiles, for listing)
        summary_data = {
            "id": protein_id,
            "species": species,
            "name": protein_id,
            "nameClean": protein_id,
            "length": length,
            "tileCount": len(protein_tiles),
            "pigOnlyTiles": pig_only_count,
            "humanOnlyTiles": human_only_count,
            "sharedTiles": shared_count,
            "coveragePct": min(100.0, coverage_pct),
            "coverageStart": coverage_start,
            "coverageEnd": coverage_end,
        }

        # Full data (with tiles, for individual protein files)
        full_data = {
            **summary_data,
            "tiles": tile_positions,
            "sequence": "",
        }

        # Add to appropriate list
        if species == "pig":
            pig_summaries.append(summary_data)
        else:
            human_summaries.append(summary_data)

        protein_lookup[protein_id] = species

        # Write individual protein file
        filename = safe_filename(protein_id) + ".json"
        protein_file = OUTPUT_DIR / "proteins" / species / filename
        with open(protein_file, "w") as f:
            json.dump(full_data, f)

        proteins_written += 1
        if proteins_written % 10000 == 0:
            print(f"  Written {proteins_written:,} protein files...")

    # Sort summaries by tile count
    pig_summaries.sort(key=lambda p: p["tileCount"], reverse=True)
    human_summaries.sort(key=lambda p: p["tileCount"], reverse=True)

    print(f"\n  Pig proteins: {len(pig_summaries):,}")
    print(f"  Human proteins: {len(human_summaries):,}")
    print(f"  Total protein files: {proteins_written:,}")

    # Build species summary
    species_data = [
        {
            "id": "pig",
            "name": "Pig (Sus scrofa)",
            "proteinCount": len(pig_summaries),
            "tileCount": sum(p["tileCount"] for p in pig_summaries),
            "pigOnlyTiles": sum(p["pigOnlyTiles"] for p in pig_summaries),
            "humanOnlyTiles": sum(p["humanOnlyTiles"] for p in pig_summaries),
            "sharedTiles": sum(p["sharedTiles"] for p in pig_summaries),
        },
        {
            "id": "human",
            "name": "Human (Homo sapiens)",
            "proteinCount": len(human_summaries),
            "tileCount": sum(p["tileCount"] for p in human_summaries),
            "pigOnlyTiles": sum(p["pigOnlyTiles"] for p in human_summaries),
            "humanOnlyTiles": sum(p["humanOnlyTiles"] for p in human_summaries),
            "sharedTiles": sum(p["sharedTiles"] for p in human_summaries),
        },
    ]

    # Build statistics
    statistics = {
        "library_summary": {
            "total_unique_tiles": stats.get("total_unique_tiles", len(tiles)),
            "pig_only_tiles": stats.get("pig_only_tiles", 0),
            "human_only_tiles": stats.get("human_only_tiles", 0),
            "shared_tiles": stats.get("shared_tiles", 0),
            "pig_proteins": len(pig_summaries),
            "human_proteins": len(human_summaries),
        },
        "coverage": {
            "proteins_with_full_coverage": sum(1 for p in pig_summaries + human_summaries if p["coveragePct"] >= 100),
            "proteins_with_partial_coverage": sum(1 for p in pig_summaries + human_summaries if p["coveragePct"] < 100),
            "mean_coverage_pct": round(
                sum(p["coveragePct"] for p in pig_summaries + human_summaries) / len(pig_summaries + human_summaries), 1
            ) if pig_summaries or human_summaries else 0,
        },
        "generation_info": {
            "pipeline": "SmartTilerV7 (pig vs human comparison)",
            "tile_length": 49,
            "tile_overlap": 25,
            "similarity_threshold": 0.8,
        },
    }

    # Build search index
    search_index = {
        "species": [
            {"id": "pig", "name": "Pig (Sus scrofa)"},
            {"id": "human", "name": "Human (Homo sapiens)"},
        ],
        "proteins": [
            {"id": p["id"], "name": p["name"], "species": p["species"]}
            for p in pig_summaries + human_summaries
        ],
    }

    # Write output files
    print("\nWriting summary files...")

    with open(OUTPUT_DIR / "species.json", "w") as f:
        json.dump(species_data, f, indent=2)
    print(f"  ✓ species.json ({len(species_data)} species)")

    # Summary files (no tiles - small files!)
    with open(OUTPUT_DIR / "proteins" / "pig-summary.json", "w") as f:
        json.dump(pig_summaries, f)
    pig_size = os.path.getsize(OUTPUT_DIR / "proteins" / "pig-summary.json") / 1e6
    print(f"  ✓ proteins/pig-summary.json ({len(pig_summaries):,} proteins, {pig_size:.1f} MB)")

    with open(OUTPUT_DIR / "proteins" / "human-summary.json", "w") as f:
        json.dump(human_summaries, f)
    human_size = os.path.getsize(OUTPUT_DIR / "proteins" / "human-summary.json") / 1e6
    print(f"  ✓ proteins/human-summary.json ({len(human_summaries):,} proteins, {human_size:.1f} MB)")

    with open(OUTPUT_DIR / "proteins" / "lookup.json", "w") as f:
        json.dump(protein_lookup, f)
    print(f"  ✓ proteins/lookup.json ({len(protein_lookup):,} mappings)")

    with open(OUTPUT_DIR / "statistics.json", "w") as f:
        json.dump(statistics, f, indent=2)
    print(f"  ✓ statistics.json")

    with open(OUTPUT_DIR / "search-index.json", "w") as f:
        json.dump(search_index, f)
    print(f"  ✓ search-index.json ({len(search_index['proteins']):,} proteins)")

    # Remove old large files if they exist
    old_files = [
        OUTPUT_DIR / "proteins" / "pig.json",
        OUTPUT_DIR / "proteins" / "human.json",
    ]
    for old_file in old_files:
        if old_file.exists():
            old_file.unlink()
            print(f"  ✓ Removed old file: {old_file.name}")

    print("\n" + "=" * 60)
    print("TRANSFORMATION COMPLETE!")
    print("=" * 60)
    print(f"  Pig proteins: {len(pig_summaries):,}")
    print(f"  Human proteins: {len(human_summaries):,}")
    print(f"  Total unique tiles: {stats.get('total_unique_tiles', len(tiles)):,}")
    print(f"  Output directory: {OUTPUT_DIR}")
    print(f"\nFile size summary:")
    print(f"  pig-summary.json: {pig_size:.1f} MB (was 405 MB)")
    print(f"  human-summary.json: {human_size:.1f} MB (was 847 MB)")
    print(f"  Individual protein files: {proteins_written:,} files in proteins/pig/ and proteins/human/")


if __name__ == "__main__":
    transform_data()
