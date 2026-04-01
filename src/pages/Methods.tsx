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
            Protein sequences are sourced from <strong>UniProt reference proteomes</strong> (canonical sequences only,
            no isoforms) to ensure characterized, non-redundant biology. MHC tiling uses the <strong>top 100 HLA
            alleles</strong> by global frequency (from pypop allele frequency data) paired with all SLA alleles from
            IPD-MHC.
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
                  <td className="py-2 pr-4">Dedup by seq</td>
                  <td className="py-2 text-right">401,854 pig</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pr-4 font-medium">Pig-only tiles</td>
                  <td className="py-2 pr-4">Pig tiles from pig-only clusters (no human ortholog)</td>
                  <td className="py-2 pr-4">95% CD-HIT</td>
                  <td className="py-2 text-right">248,905</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pr-4 font-medium">SLA tiles</td>
                  <td className="py-2 pr-4">IPD-MHC SLA alleles (all, no cutoff), consensus-filled</td>
                  <td className="py-2 pr-4">Dedup vs main</td>
                  <td className="py-2 text-right">2,397</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Human tiles</td>
                  <td className="py-2 pr-4">Human orthologs (49AA counterparts) + top 100 HLA alleles</td>
                  <td className="py-2 pr-4">Dedup by seq</td>
                  <td className="py-2 text-right">322,509</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Pig tiles where ALL human matches are 100% identical (~137K) are <strong>excluded</strong> from the library.
          </p>
        </section>

        {/* ── Pipeline Overview ── */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Pipeline Overview
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 font-mono text-sm overflow-x-auto">
            <pre className="text-gray-700 dark:text-gray-300">{`
UniProt Pig ──┐  step1: RBH                step2              step3
(UP000008227) ├── BLAST pig→human ──┐                         ┌── paired tiles
UniProt Human─┘   BLAST human→pig ──┤── reciprocal ──► MAFFT ─┤── pig-only tiles
(UP000005640)     (excl MHC)        │   best hits     align   └── combined library
                                    └── pig-only              (filter 100% identical)
                                        (no RBH)                    │
                              step6b                                │  step7
  pypop freq ──► top 100 HLA (classical) ──┐                       │
  IMGT/HLA ──► all HLA (non-classical) ────┤── pair ──┐            │
  IPD-MHC ──► all SLA (no cutoff) ─────────┘  (locus) ├── merge ──┤
                                                       │    dedup  │
                           90% CD-HIT pig-only ────────┘           ▼
                                                          final_library
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
                Step 1: Reciprocal Best BLAST Hit (RBH) ortholog detection
              </h3>
              <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-2">step1_rbh_orthologs.py</p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                <li>Loads pig (~22K) + human (~21K) proteins from UniProt canonical reference proteomes (one per gene)</li>
                <li><strong>Excludes MHC proteins</strong> — handled separately in Step 6b</li>
                <li>BLAST pig&rarr;human and human&rarr;pig proteomes (E-value &lt; 1e-5)</li>
                <li>Reciprocal best hits: if pig A's best human hit is B AND B's best pig hit is A, they're orthologs</li>
                <li><strong>16,983 ortholog pairs (76.6%)</strong> — including 3,749 pairs below 80% identity that CD-HIT would miss</li>
                <li>5,175 pig proteins with no human ortholog at any identity (truly pig-specific)</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="border-l-4 border-pink-500 pl-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                Step 2: MAFFT pairwise alignment
              </h3>
              <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-2">step2_rbh_align.py</p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                <li>MAFFT pairwise alignment of each pig-human ortholog pair</li>
                <li>16,983 pairs aligned, position-matched for tile extraction</li>
                <li>Catches orthologs at any identity level (27-100%)</li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="border-l-4 border-pink-500 pl-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                Step 3: Paired tiles + pig-only tiles
              </h3>
              <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-2">step3_rbh_paired_tiles.py</p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                <li>Tile each pig protein (49 AA, step 24), map through alignment to human</li>
                <li>~332K paired tiles (similar + divergent), ~78K identical (excluded)</li>
                <li>~50K pig-only tiles (naive tiled, no human ortholog)</li>
                <li>89% of pig tiles have a human counterpart for differential enrichment</li>
              </ul>
            </div>

            {/* Step 6b */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                Step 6b: MHC tiling — Top 100 HLA + non-classical + all SLA
              </h3>
              <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-2">step6b_uniprot_mhc_tiles.py</p>

              <div className="ml-4 mb-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">HLA (Classical — top 100 by frequency):</p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                  <li>Allele frequencies from pypop data (288 CWD alleles across 6 classical loci)</li>
                  <li>Top 100 by global frequency: A(13), B(17), C(19), DRB1(18), DQA1(7), DQB1(13), DPA1(4), DPB1(9)</li>
                  <li>Each annotated with UniProt canonical gene accession</li>
                </ul>
              </div>

              <div className="ml-4 mb-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">HLA (Non-classical — all alleles from IMGT):</p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                  <li>HLA-E, HLA-F, HLA-G (non-classical Class I — NK cell recognition, immune tolerance)</li>
                  <li>HLA-DRA, HLA-DRB3/4/5 (Class II DR family)</li>
                  <li>HLA-DMA/DMB, HLA-DOA/DOB (Class II accessory — peptide loading)</li>
                  <li>All alleles loaded from IMGT/HLA (no frequency filter for these loci)</li>
                </ul>
              </div>

              <div className="ml-4 mb-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">SLA (all alleles, no cutoff):</p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                  <li>529 alleles from IPD-MHC API, 505 parsed with protein sequences</li>
                  <li>Per-locus MAFFT align &rarr; 474 unique proteins &rarr; 4,917 tiles</li>
                  <li>24 SLA loci including Class I (SLA-1/2/3/6/7/8/9/11/12) and Class II (DRA/DRB/DQA/DQB1/DMA/DOA/DOB)</li>
                </ul>
              </div>

              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">SLA&harr;HLA pairing:</p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 text-sm">
                  <li>Ortholog locus map: SLA-1&rarr;HLA-A, SLA-2&rarr;HLA-B, SLA-3&rarr;HLA-C, etc.</li>
                  <li>4,224 SLA tiles paired (693 unpaired — minor loci without HLA ortholog)</li>
                  <li>Mean SLA&harr;HLA identity: 39.9%</li>
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
                <li>95% CD-HIT collapse of pig-only tiles (282,594 &rarr; 248,905; 12% savings)</li>
                <li>Merge: paired pig tiles + collapsed pig-only + SLA tiles</li>
                <li>Human ortholog tiles (321,869) + HLA tiles (640 after dedup)</li>
                <li>Final deduplication across all pools</li>
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
                  <td className="py-2">CD-HIT identity for pig-only redundancy reduction</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Identical exclusion</td>
                  <td className="py-2 pr-4">100%</td>
                  <td className="py-2">Tiles 100% identical to human are excluded (no rejection potential)</td>
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

          <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Pig Tiles (653,156)</h3>
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-red-600 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">Unique — 248,905 (38.1%)</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  No human homolog at 80% clustering. Highest rejection potential — completely foreign to human immune system.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-yellow-500 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">Divergent — 84,610 (13.0%)</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  Has human match with &lt;80% identity. Strong rejection candidates with many epitope differences.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-green-500 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">Similar — 317,244 (48.6%)</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  Has human match with 80-99% identity. Subtle epitope differences; paired human tile enables differential enrichment.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-purple-500 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">SLA — 2,397 (0.4%)</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  Swine Leukocyte Antigen tiles from 474 unique proteins (IPD-MHC). Key drivers of transplant rejection.
                </span>
              </div>
            </div>
          </div>

          <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">Human Tiles (322,509)</h3>
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-cyan-500 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">Human Ortholog — 321,869</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  49 AA human counterpart tiles for differential enrichment comparison.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-blue-500 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">HLA — 640</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  Top 100 HLA alleles (by global frequency) as counterparts to SLA tiles.
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-4 h-4 rounded bg-gray-400 shrink-0 mt-1" />
            <div>
              <strong className="text-gray-900 dark:text-white">Excluded — Identical (~137K)</strong>
              <span className="text-gray-600 dark:text-gray-400 ml-2">
                100% identical to human. No rejection potential.
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
                  <td className="py-2 text-right">975,665</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pl-4">Pig tiles</td>
                  <td className="py-2 text-right">653,156</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pl-8 text-xs">Paired (similar + divergent)</td>
                  <td className="py-2 text-right text-xs">401,854</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pl-8 text-xs">Pig-only (unique, no human homolog)</td>
                  <td className="py-2 text-right text-xs">248,905</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pl-8 text-xs">SLA (MHC alleles)</td>
                  <td className="py-2 text-right text-xs">2,397</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pl-4">Human tiles</td>
                  <td className="py-2 text-right">322,509</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 pl-8 text-xs">Human orthologs (paired counterparts)</td>
                  <td className="py-2 text-right text-xs">321,869</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-2 pl-8 text-xs">HLA (top 100 alleles)</td>
                  <td className="py-2 text-right text-xs">640</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2">Pig proteins covered</td>
                  <td className="py-2 text-right">45,602</td>
                </tr>
                <tr>
                  <td className="py-2">Excluded (100% identical to human)</td>
                  <td className="py-2 text-right">136,859</td>
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
              <p>Sus scrofa — UniProt reference proteome UP000008227 (canonical, no isoforms)</p>
              <p>45,875 proteins after filtering (&ge;49 AA, &le;10% ambiguous residues)</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="font-medium text-gray-800 dark:text-gray-200">Human proteome</p>
              <p>Homo sapiens — UniProt reference proteome UP000005640 (canonical, no isoforms)</p>
              <p>78,180 proteins after filtering</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="font-medium text-gray-800 dark:text-gray-200">HLA alleles (top 100)</p>
              <p>IMGT/HLA database filtered to top 100 alleles by global frequency (pypop CWD data)</p>
              <p>Each allele annotated with UniProt canonical gene accession (P04439, P01889, etc.)</p>
              <p>99 alleles matched: A(13), B(17), C(19), DRB1(18), DQ(20), DP(13)</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="font-medium text-gray-800 dark:text-gray-200">SLA alleles (all)</p>
              <p>IPD-MHC database — 529 alleles via REST API, no frequency cutoff</p>
              <p>474 unique proteins after per-locus MAFFT alignment and consensus fill</p>
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
            <li><strong>Higher pig enrichment vs human</strong> &rarr; rejection epitope (pig-specific immune response)</li>
            <li><strong>Similar enrichment</strong> &rarr; conserved epitope (cross-reactive, less likely rejection-specific)</li>
            <li><strong>Higher human enrichment</strong> &rarr; autoimmune or pre-existing epitope</li>
            <li>401,854 pig tiles have paired human counterparts for direct comparison</li>
            <li>SLA&harr;HLA pairs enable MHC-specific differential enrichment</li>
          </ul>
        </section>

        {/* ── SLA↔HLA Ortholog Map ── */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            SLA&harr;HLA Ortholog Locus Map
          </h2>
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
                {[
                  ['SLA-1', 'HLA-A', 'I'],
                  ['SLA-2', 'HLA-B', 'I'],
                  ['SLA-3', 'HLA-C', 'I'],
                  ['SLA-DRA', 'HLA-DRA', 'II'],
                  ['SLA-DRB1', 'HLA-DRB1', 'II'],
                  ['SLA-DQA', 'HLA-DQA1', 'II'],
                  ['SLA-DQB1', 'HLA-DQB1', 'II'],
                  ['SLA-DMA', 'HLA-DMA', 'II'],
                  ['SLA-DMB', 'HLA-DMB', 'II'],
                  ['SLA-DOA', 'HLA-DOA', 'II'],
                  ['SLA-DOB', 'HLA-DOB', 'II'],
                ].map(([sla, hla, cls]) => (
                  <tr key={sla} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-1.5 pr-6">{sla}</td>
                    <td className="py-1.5 pr-6">{hla}</td>
                    <td className="py-1.5">{cls}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
            Minor SLA loci (SLA-6/7/8/9/11/12, MIC, TAP) have no clear HLA ortholog and remain unpaired.
          </p>
        </section>

        {/* ── Pipeline Scripts ── */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Pipeline Scripts
          </h2>
          <ol className="list-decimal list-inside text-gray-600 dark:text-gray-400 space-y-1 font-mono text-sm">
            <li>step1_cluster_80.py — CD-HIT clustering at 80% (MHC excluded)</li>
            <li>step2_mafft_align.py — MAFFT alignment of mixed clusters</li>
            <li>step3_paired_tiles.py — Generate paired pig-human tiles</li>
            <li>step5_combined_library.py — Combine with pig-only tiles, filter 100% identical</li>
            <li>step6b_uniprot_mhc_tiles.py — Top 100 HLA + all SLA, UniProt-sourced</li>
            <li>step7_final_assembly.py — Final assembly: merge all pools + collapse + dedup</li>
            <li>step8_oligo_generation.py — Codon optimize &rarr; 195bp DNA oligos</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
