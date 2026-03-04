export default function Methods() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Methods
      </h1>

      <div className="prose dark:prose-invert max-w-none">
        {/* ── Overview ── */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Overview
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This is a PhIP-seq peptide library for <strong>xenotransplant rejection epitope discovery</strong>.
            The library tiles the pig proteome and pairs each pig tile with its aligned human ortholog region,
            so after immunoprecipitation with patient sera you can compare enrichment between paired pig/human
            tiles to identify rejection epitopes. Tiles that are 100% identical to their human counterpart are
            excluded as they have no rejection potential.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The library also includes dedicated <strong>MHC tiling</strong>: all SLA (Swine Leukocyte Antigen)
            alleles from the IPD-MHC database are tiled and paired with orthologous HLA (Human Leukocyte Antigen)
            alleles from IMGT/HLA. MHC proteins are key drivers of transplant rejection and are handled
            separately from the general proteome to preserve allelic diversity.
          </p>
        </section>

        {/* ── Library Design ── */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Library Design
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The library is assembled from four tile pools, combined into one final library:
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4">Pool</th>
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2 pr-4">Collapse</th>
                  <th className="py-2 text-right">Tiles</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 dark:text-gray-400">
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pr-4 font-medium">Paired tiles</td>
                  <td className="py-2 pr-4">Pig tiles from mixed pig-human clusters, each paired with best human match</td>
                  <td className="py-2 pr-4">100% (keep all)</td>
                  <td className="py-2 text-right">442,511 pig</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pr-4 font-medium">Pig-only tiles</td>
                  <td className="py-2 pr-4">Pig tiles from pig-only clusters (no human ortholog)</td>
                  <td className="py-2 pr-4">95% CD-HIT</td>
                  <td className="py-2 text-right">218,269</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pr-4 font-medium">SLA tiles</td>
                  <td className="py-2 pr-4">IPD-MHC SLA alleles, per-locus MAFFT consensus-filled</td>
                  <td className="py-2 pr-4">None (all kept)</td>
                  <td className="py-2 text-right">595</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Human tiles</td>
                  <td className="py-2 pr-4">Human orthologs (49AA counterparts) + HLA paired tiles</td>
                  <td className="py-2 pr-4">Dedup by seq</td>
                  <td className="py-2 text-right">421,277</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Pig tiles where ALL human matches are 100% identical (~164K) are <strong>excluded</strong> from the library.
            Human ortholog tiles are only included when they are exactly 49 AA (no indels from alignment).
          </p>
        </section>

        {/* ── Pipeline Overview ── */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Pipeline Overview
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 font-mono text-sm overflow-x-auto">
            <pre className="text-gray-700 dark:text-gray-300">{`
                     step1                    step2                  step3
Pig FASTA ──┐  (exclude MHC)                                       ┌── paired_tiles.pkl
            ├── CD-HIT 80% ──► mixed_clusters ──► MAFFT align ──► ├── paired_library.fasta
Human FASTA─┘   cluster        pig_only_clusters                    └── pair_metadata.tsv
                                    │
                                    ▼  step5
                              Naive tile + merge ──► combined_tiles.pkl
                              Filter 100% identical    combined_library.fasta
                                                           │
                                        step6              │   step7
                IPD-MHC API ──► SLA ──┐                    │
                   MAFFT align        ├── pair ──┐         │
                IMGT/HLA ─────► HLA ──┘  (locus) ├─ merge ┤──► final_library.fasta
                   MAFFT align                    │  dedup │    final_metadata.tsv
                                                  │        │    final_stats.json
                  95% collapse pig-only ──────────┘        ▼
                                                  transform_data.py
                                                  ──► visualizer JSON
            `.trim()}</pre>
          </div>
        </section>

        {/* ── Step-by-Step Details ── */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Step-by-Step Details
          </h2>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="border-l-4 border-pink-500 pl-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                Step 1: Cluster at 80% identity
              </h3>
              <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-2">step1_cluster_80.py</p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                <li>Loads pig (63,575) + human (136,807) proteins with species tags</li>
                <li><strong>Excludes MHC proteins</strong> (SLA/HLA) before clustering — handled separately in Step 6</li>
                <li>Pig MHC: matches <code>SLA-</code>, <code>MHC class</code>, <code>histocompatibility antigen</code> (excludes MICA/MICB)</li>
                <li>Human MHC: matches <code>HLA-</code>, <code>MHC class</code>, <code>histocompatibility antigen</code></li>
                <li>CD-HIT at 80% identity (word size 5, <code>-g 1</code> for accuracy)</li>
                <li>Separates into: <strong>mixed</strong> (pig+human), <strong>pig-only</strong>, and <strong>human-only</strong> clusters</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="border-l-4 border-pink-500 pl-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                Step 2: MAFFT alignment of mixed clusters
              </h3>
              <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-2">step2_mafft_align.py</p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                <li>For each mixed cluster: <code>mafft --auto</code> to align pig and human proteins</li>
                <li>5-minute timeout per cluster; parallelizable with <code>--workers</code></li>
                <li>Produces alignment that maps pig positions to human counterparts</li>
                <li><code>--resume</code> flag to skip already-aligned clusters</li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="border-l-4 border-pink-500 pl-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                Step 3: Generate paired tiles
              </h3>
              <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-2">step3_paired_tiles.py</p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                <li>Tile each pig protein in aligned clusters (49 AA, step 24)</li>
                <li>Map tile positions through alignment to find corresponding human region</li>
                <li>Calculate pairwise identity (ignoring gaps) for each pig-human tile pair</li>
                <li>Keep best human match per tile</li>
                <li>Categorize: identical (100%), similar (&ge;80%), divergent (&lt;80%)</li>
                <li>Deduplicate by pig tile sequence (keep highest identity match)</li>
              </ul>
            </div>

            {/* Step 5 */}
            <div className="border-l-4 border-pink-500 pl-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                Step 5: Combined library
              </h3>
              <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-2">step5_combined_library.py</p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                <li>Tiles ALL pig proteins (pig-only clusters get naive tiling, mixed clusters use paired info)</li>
                <li>Deduplicates by sequence, tracks all human matches per tile</li>
                <li><strong>Filters out</strong> tiles where ALL human matches are 100% identical</li>
                <li>Categorizes into: unique, unique_with_homolog, divergent, similar</li>
              </ul>
            </div>

            {/* Step 6 */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                Step 6: MHC tiling — SLA + HLA
              </h3>
              <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-2">step6_sla_tiles.py</p>

              <div className="ml-4 mb-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">SLA (Swine Leukocyte Antigen):</p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                  <li>Fetches all SLA alleles from the IPD-MHC API (paginated)</li>
                  <li>Groups alleles by locus (SLA-1, SLA-DRB1, SLA-DQA, etc.)</li>
                  <li>Per-locus MAFFT alignment to build consensus sequence</li>
                  <li>Fills ambiguous residues (X/?) with consensus amino acid at each position</li>
                  <li>Deduplicates to unique protein sequences — no CD-HIT collapse, preserving allelic variants</li>
                  <li>Tiles all unique SLA proteins (49 AA, step 24) &rarr; 1,265 SLA tiles from 172 unique proteins</li>
                </ul>
              </div>

              <div className="ml-4 mb-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">HLA (Human Leukocyte Antigen):</p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                  <li>Loads ~44K alleles from IMGT/HLA (<code>hla_prot.fasta</code>)</li>
                  <li>Filters to relevant loci: Class I (A, B, C, E, F, G) and Class II (DRA, DRB1/3/4/5, DQA1, DQB1, DPA1, DPB1, DMA, DMB, DOA, DOB)</li>
                  <li>Excludes null alleles (N suffix) and sequences &lt;49 AA</li>
                  <li>Same per-locus pipeline: MAFFT align &rarr; consensus fill &rarr; validate &rarr; tile</li>
                  <li>MAFFT strategy adapts by locus size: <code>--auto</code> (&le;500 seqs), <code>--retree 1</code> (&le;2000), <code>--parttree</code> (&gt;2000)</li>
                  <li>26,154 unique HLA proteins &rarr; 276,445 HLA tiles</li>
                </ul>
              </div>

              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">SLA&harr;HLA pairing:</p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                  <li>Ortholog locus map: SLA-1&rarr;HLA-A, SLA-2&rarr;HLA-B, SLA-3&rarr;HLA-C, SLA-DRA&rarr;HLA-DRA, SLA-DRB1&rarr;HLA-DRB1, etc.</li>
                  <li>For each SLA tile, finds best-matching HLA tile from orthologous locus by 49AA identity</li>
                  <li>99.2% of SLA tiles successfully paired (1,255 of 1,265); mean identity 72.4%</li>
                  <li>Minor SLA loci without orthologs (SLA-6/7/8/11/12) remain unpaired</li>
                </ul>
              </div>
            </div>

            {/* Step 7 */}
            <div className="border-l-4 border-pink-500 pl-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                Step 7: Final assembly
              </h3>
              <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-2">step7_final_assembly.py</p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                <li>95% CD-HIT collapse of pig-only tiles (263,054 &rarr; 218,269; 17% savings)</li>
                <li>Merge: paired pig tiles + collapsed pig-only + SLA tiles</li>
                <li>Extract human ortholog tiles: 49 AA human counterparts from paired clusters (379,204 tiles)</li>
                <li>Add HLA tiles as paired human counterparts (42,073 tiles)</li>
                <li>Final deduplication pass across all pools</li>
                <li>SLA tiles deduped against existing pig tiles: 670 of 1,265 already present &rarr; 595 added</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Tiling Parameters ── */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Tiling Parameters
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4">Parameter</th>
                  <th className="py-2 pr-4">Value</th>
                  <th className="py-2">Description</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 dark:text-gray-400">
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pr-4 font-medium">Tile length</td>
                  <td className="py-2 pr-4">49 AA</td>
                  <td className="py-2">Standard PhIP-seq tile</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pr-4 font-medium">Tile step</td>
                  <td className="py-2 pr-4">24 AA</td>
                  <td className="py-2">25 AA overlap between adjacent tiles</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pr-4 font-medium">Clustering threshold</td>
                  <td className="py-2 pr-4">80%</td>
                  <td className="py-2">CD-HIT identity for ortholog grouping</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pr-4 font-medium">Pig-only collapse</td>
                  <td className="py-2 pr-4">95%</td>
                  <td className="py-2">CD-HIT identity for redundancy reduction of pig-only tiles</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pr-4 font-medium">SLA/HLA collapse</td>
                  <td className="py-2 pr-4">None</td>
                  <td className="py-2">All unique allelic variants preserved (sequence dedup only)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Gap tolerance</td>
                  <td className="py-2 pr-4">Max 20%</td>
                  <td className="py-2">Maximum gaps in human alignment region for valid pairing</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Tile Categories ── */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Tile Categories
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Pig tiles are categorized based on their relationship to human homologs.
            Human ortholog and HLA tiles are included as paired counterparts for differential enrichment.
          </p>

          <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Pig Tiles (661,375)</h3>
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-red-600 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">Unique — 218,269 (33.0%)</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  No human homolog detected. These pig proteins have no close match in the human proteome
                  at 80% clustering threshold. Highest rejection potential — the immune system has never
                  seen these sequences.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-orange-500 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">Unique with Homolog — 2 ({"<"}0.1%)</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  Has a human homolog protein, but the alignment at this tile position was too gappy
                  to generate a valid paired comparison. Likely highly divergent regions within
                  otherwise conserved proteins.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-yellow-500 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">Divergent — 72,480 (11.0%)</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  Has human match with &lt;80% sequence identity. These tiles differ significantly
                  from their human counterpart. Strong rejection candidates — enough sequence differences
                  to present novel epitopes.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-green-500 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">Similar — 370,029 (55.9%)</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  Has human match with 80-99% sequence identity. These tiles have subtle epitope
                  differences that may trigger immune response. The paired human tile enables
                  direct differential enrichment to pinpoint rejection-specific signal.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-purple-500 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">SLA — 595 (0.1%)</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  Swine Leukocyte Antigen tiles from IPD-MHC alleles. Per-locus MAFFT aligned and
                  consensus-filled to resolve ambiguous residues. Each SLA tile is paired with its
                  best-matching HLA counterpart from the orthologous locus.
                  Key drivers of acute transplant rejection.
                </span>
              </div>
            </div>
          </div>

          <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Human Tiles (421,277)</h3>
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-cyan-500 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">Human Ortholog — 379,204</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  49 AA human counterpart tiles extracted from MAFFT alignments of mixed clusters.
                  Only tiles with exactly 49 AA (no indels) are included in the library. These are
                  the direct comparison tiles — after IP, compare pig tile enrichment vs its paired
                  human ortholog tile to identify rejection-specific epitopes.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-blue-500 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">HLA — 42,073</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  Human Leukocyte Antigen tiles from IMGT/HLA. These are the paired counterparts
                  to SLA tiles, derived from the same per-locus MAFFT alignment pipeline.
                  Enables MHC-specific differential enrichment: compare SLA tile enrichment vs
                  its orthologous HLA tile to identify MHC-specific rejection epitopes.
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded bg-gray-400 shrink-0 mt-1" />
            <div>
              <strong className="text-gray-900 dark:text-white">Excluded — Identical (~164K)</strong>
              <span className="text-gray-600 dark:text-gray-400 ml-2">
                100% identical to human counterpart. These tiles were excluded from the library
                as they have no rejection potential — the immune system recognizes them as self.
              </span>
            </div>
          </div>
        </section>

        {/* ── Library Contents ── */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Library Contents
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
            <table className="w-full text-sm">
              <tbody className="text-gray-600 dark:text-gray-400">
                <tr className="border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-800 dark:text-gray-200">
                  <td className="py-2">Total unique sequences</td>
                  <td className="py-2 text-right">1,082,652</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pl-4">Pig tiles</td>
                  <td className="py-2 text-right">661,375</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pl-8 text-xs">Paired (from mixed clusters)</td>
                  <td className="py-2 text-right text-xs">442,511</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pl-8 text-xs">Pig-only (no human homolog)</td>
                  <td className="py-2 text-right text-xs">218,269</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pl-8 text-xs">SLA (MHC alleles)</td>
                  <td className="py-2 text-right text-xs">595</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pl-4">Human tiles</td>
                  <td className="py-2 text-right">421,277</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pl-8 text-xs">Human orthologs (from paired clusters)</td>
                  <td className="py-2 text-right text-xs">379,204</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-2 pl-8 text-xs">HLA (MHC paired counterparts)</td>
                  <td className="py-2 text-right text-xs">42,073</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2">Pig proteins covered</td>
                  <td className="py-2 text-right">62,375</td>
                </tr>
                <tr>
                  <td className="py-2">Mean protein coverage</td>
                  <td className="py-2 text-right">85.9%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">MHC Breakdown</h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <table className="w-full text-sm">
              <tbody className="text-gray-600 dark:text-gray-400">
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2">SLA alleles fetched (IPD-MHC)</td>
                  <td className="py-2 text-right">200</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2">SLA unique proteins after dedup</td>
                  <td className="py-2 text-right">172</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2">Total SLA tiles (before dedup with main library)</td>
                  <td className="py-2 text-right">1,265</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2">SLA loci: Class I</td>
                  <td className="py-2 text-right">SLA-1 (284 tiles)</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2">SLA loci: Class II</td>
                  <td className="py-2 text-right">DRB1 (435), DQB1 (269), DQA (182), DRA (50), DMA (33), DRB5 (10), DRB2 (2)</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-2">SLA tiles with HLA pair</td>
                  <td className="py-2 text-right">1,255 / 1,265 (99.2%)</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2">HLA alleles loaded (IMGT/HLA)</td>
                  <td className="py-2 text-right">41,522</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2">HLA unique proteins after dedup</td>
                  <td className="py-2 text-right">26,154</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2">Total HLA tiles generated</td>
                  <td className="py-2 text-right">276,445</td>
                </tr>
                <tr>
                  <td className="py-2">Mean SLA&harr;HLA identity</td>
                  <td className="py-2 text-right">72.4%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Data Sources ── */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Data Sources
          </h2>
          <div className="space-y-3 text-gray-600 dark:text-gray-400 text-sm">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="font-medium text-gray-800 dark:text-gray-200">Pig proteome</p>
              <p>Sus scrofa — NCBI RefSeq GCF_000003025.6 (Sscrofa11.1)</p>
              <p>63,575 proteins</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="font-medium text-gray-800 dark:text-gray-200">Human proteome</p>
              <p>Homo sapiens — NCBI RefSeq GCF_000001405.40 (GRCh38.p14)</p>
              <p>136,807 proteins</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="font-medium text-gray-800 dark:text-gray-200">SLA alleles</p>
              <p>IPD-MHC database — all SLA alleles via REST API</p>
              <p>Per-locus MAFFT aligned; consensus-filled to resolve ambiguous residues</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="font-medium text-gray-800 dark:text-gray-200">HLA alleles</p>
              <p>IMGT/HLA database — <code>hla_prot.fasta</code> from ANHIG/IMGTHLA GitHub</p>
              <p>~44K alleles, 26,154 unique protein sequences after dedup</p>
              <p>Filtered to Class I (A/B/C/E/F/G) and Class II (DR/DQ/DP/DM/DO) loci</p>
            </div>
          </div>
        </section>

        {/* ── Differential Enrichment ── */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Differential Enrichment Analysis
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The library is designed for paired differential enrichment. After IP with patient sera:
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2 text-sm">
            <li>Each pig tile has a matching human ortholog tile (when available) in the library</li>
            <li><strong>Higher pig enrichment vs human</strong> &rarr; rejection epitope (immune response to pig-specific sequence)</li>
            <li><strong>Similar enrichment for both</strong> &rarr; conserved epitope (cross-reactive, less likely rejection-specific)</li>
            <li><strong>Higher human enrichment</strong> &rarr; autoimmune or pre-existing epitope</li>
            <li>383,185 pig tiles (57.9%) have synthesizable 49AA paired human tiles for direct comparison</li>
            <li>SLA&harr;HLA pairs enable the same analysis specifically for MHC antigens</li>
          </ul>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Note:</strong> 56,412 pig tiles have human counterparts with indels (not exactly 49 AA).
              These human tiles are excluded from the library since they cannot be synthesized at standard
              PhIP-seq tile length, but the identity information is preserved in tile metadata.
            </p>
          </div>
        </section>

        {/* ── Ortholog Locus Map ── */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            SLA&harr;HLA Ortholog Locus Map
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Each SLA tile is paired with its best-matching HLA tile from the orthologous locus.
            This mapping reflects evolutionary relationships between pig and human MHC genes:
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-6">SLA Locus</th>
                  <th className="py-2 pr-6">HLA Locus</th>
                  <th className="py-2">Class</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 dark:text-gray-400">
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-1.5 pr-6">SLA-1</td>
                  <td className="py-1.5 pr-6">HLA-A</td>
                  <td className="py-1.5">I</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-1.5 pr-6">SLA-2</td>
                  <td className="py-1.5 pr-6">HLA-B</td>
                  <td className="py-1.5">I</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-1.5 pr-6">SLA-3</td>
                  <td className="py-1.5 pr-6">HLA-C</td>
                  <td className="py-1.5">I</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-1.5 pr-6">SLA-DRA</td>
                  <td className="py-1.5 pr-6">HLA-DRA</td>
                  <td className="py-1.5">II</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-1.5 pr-6">SLA-DRB1</td>
                  <td className="py-1.5 pr-6">HLA-DRB1</td>
                  <td className="py-1.5">II</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-1.5 pr-6">SLA-DQA</td>
                  <td className="py-1.5 pr-6">HLA-DQA1</td>
                  <td className="py-1.5">II</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-1.5 pr-6">SLA-DQB1</td>
                  <td className="py-1.5 pr-6">HLA-DQB1</td>
                  <td className="py-1.5">II</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-1.5 pr-6">SLA-DMA</td>
                  <td className="py-1.5 pr-6">HLA-DMA</td>
                  <td className="py-1.5">II</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-1.5 pr-6">SLA-DMB</td>
                  <td className="py-1.5 pr-6">HLA-DMB</td>
                  <td className="py-1.5">II</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-1.5 pr-6">SLA-DOA</td>
                  <td className="py-1.5 pr-6">HLA-DOA</td>
                  <td className="py-1.5">II</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-6">SLA-DOB</td>
                  <td className="py-1.5 pr-6">HLA-DOB</td>
                  <td className="py-1.5">II</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
            Minor SLA loci (SLA-6, SLA-7, SLA-8, SLA-11, SLA-12) have no clear HLA ortholog and remain unpaired.
          </p>
        </section>

        {/* ── Pipeline Scripts ── */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Pipeline Scripts
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm">
            The library was generated using the following pipeline:
          </p>
          <ol className="list-decimal list-inside text-gray-600 dark:text-gray-400 space-y-1 font-mono text-sm">
            <li>step1_cluster_80.py — CD-HIT clustering at 80% (MHC excluded)</li>
            <li>step2_mafft_align.py — MAFFT alignment of mixed clusters</li>
            <li>step3_paired_tiles.py — Generate paired pig-human tiles</li>
            <li>step5_combined_library.py — Combine with pig-only tiles, filter 100% identical</li>
            <li>step6_sla_tiles.py — SLA/HLA allele tiling and cross-species pairing</li>
            <li>step7_final_assembly.py — Final assembly: merge all pools + human orthologs</li>
            <li>transform_data.py — Generate visualizer JSON from final tiles</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
