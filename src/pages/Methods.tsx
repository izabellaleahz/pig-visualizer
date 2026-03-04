export default function Methods() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Methods
      </h1>

      <div className="prose dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Overview
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This library contains pig protein tiles for xenotransplant rejection epitope discovery.
            Each pig tile is paired with its best human homolog (when available) to enable
            differential enrichment analysis. Tiles that are 100% identical to human are excluded
            as they have no rejection potential.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Pipeline Overview
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4 font-mono text-sm overflow-x-auto">
            <pre className="text-gray-700 dark:text-gray-300">{`
Pig proteome (63K)       Human proteome (136K)
  (exclude MHC)            (exclude MHC)
        │                          │
        └──────────┬───────────────┘
                   ▼
         CD-HIT clustering (80%)
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
   Mixed clusters        Pig-only clusters
        │                     │
        ▼                     │
   MAFFT alignment            │
        │                     │
        ▼                     ▼
   Paired tiles          Unique tiles
   (pig + human)         (no human match)
        │                     │
        └──────────┬──────────┘
                   ▼
       Combine & filter 100% identical
                   │
   IPD-MHC SLA ──┐ │
   IMGT/HLA ─────┤ │
     MAFFT align  ├─┘
     consensus    │
     SLA↔HLA pair─┘
                   │
                   ▼
         Final library (~1.08M tiles)
         661K pig + 421K human
            `.trim()}</pre>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Tiling Parameters
          </h2>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
            <li><strong>Tile length:</strong> 49 amino acids</li>
            <li><strong>Overlap:</strong> 25 amino acids (24 aa step size)</li>
            <li><strong>Clustering threshold:</strong> 80% sequence identity</li>
            <li><strong>Alignment:</strong> MAFFT for mixed clusters</li>
            <li><strong>Gap tolerance:</strong> Max 20% gaps in human alignment</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Tile Categories
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Tiles are categorized based on their relationship to human homologs:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-red-600 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">Unique (35.1%)</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  No human homolog detected. These pig proteins have no close match in the human proteome
                  at 80% clustering threshold. Highest rejection potential.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-orange-500 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">Unique with Homolog (3.0%)</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  Has a human homolog protein, but the alignment at this tile position was too gappy
                  to generate a valid paired comparison. Likely divergent region.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-yellow-500 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">Divergent (8.1%)</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  Has human match with &lt;80% sequence identity. These tiles differ significantly
                  from their human counterpart. Good rejection candidates.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-green-500 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">Similar (53.8%)</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  Has human match with 80-99% sequence identity. These tiles have some epitope
                  differences that may trigger immune response.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-purple-500 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">SLA (pig MHC)</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  Swine Leukocyte Antigen tiles from IPD-MHC alleles. Per-locus MAFFT aligned,
                  consensus-filled, and paired with orthologous HLA counterparts. Key targets
                  for transplant rejection.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-blue-500 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">HLA (human MHC)</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  Human Leukocyte Antigen tiles from IMGT/HLA. Paired counterparts to SLA tiles
                  for differential enrichment analysis.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-cyan-500 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">Human Ortholog</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  Human ortholog tiles from paired clusters. These are the 49AA human counterparts
                  included in the library for direct comparison with pig tiles.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 rounded bg-gray-400 shrink-0 mt-1" />
              <div>
                <strong className="text-gray-900 dark:text-white">Excluded - Identical</strong>
                <span className="text-gray-600 dark:text-gray-400 ml-2">
                  100% identical to human. These tiles were excluded from the library
                  as they have no rejection potential.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Library Contents
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <table className="w-full text-sm">
              <tbody className="text-gray-600 dark:text-gray-400">
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-2 font-medium">Total sequences</td>
                  <td className="py-2 text-right">~1,082,652</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-2 font-medium">Pig tiles</td>
                  <td className="py-2 text-right">~661,375</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-2 font-medium">Human tiles (orthologs + HLA)</td>
                  <td className="py-2 text-right">~421,277</td>
                </tr>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-2 font-medium">SLA tiles</td>
                  <td className="py-2 text-right">~1,265</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">HLA tiles (paired)</td>
                  <td className="py-2 text-right">~42,073</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Data Sources
          </h2>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
            <li><strong>Pig proteome:</strong> Sus scrofa (GCF_000003025.6_Sscrofa11.1) - 63,575 proteins</li>
            <li><strong>Human proteome:</strong> Homo sapiens (GCF_000001405.40_GRCh38.p14) - 136,807 proteins</li>
            <li><strong>SLA alleles:</strong> IPD-MHC database (all SLA alleles, per-locus aligned)</li>
            <li><strong>HLA alleles:</strong> IMGT/HLA (hla_prot.fasta) - ~44K alleles</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Differential Enrichment Analysis
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            For tiles with human matches, you can compare enrichment between paired pig and human tiles:
          </p>
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2">
            <li>Tiles are named with matching IDs (e.g., PIG_0300000_PIG and PIG_0300000_HUMAN_0)</li>
            <li>Identity percentage is included in the header</li>
            <li>Higher pig enrichment vs human suggests rejection epitope</li>
            <li>Similar enrichment suggests conserved epitope</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Pipeline Scripts
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            The library was generated using the following pipeline:
          </p>
          <ol className="list-decimal list-inside text-gray-600 dark:text-gray-400 space-y-1 font-mono text-sm">
            <li>step1_cluster_80.py - CD-HIT clustering at 80% (MHC excluded)</li>
            <li>step2_mafft_align.py - MAFFT alignment of mixed clusters</li>
            <li>step3_paired_tiles.py - Generate paired pig-human tiles</li>
            <li>step5_combined_library.py - Combine with pig-only tiles, filter identical</li>
            <li>step6_sla_tiles.py - SLA/HLA allele tiling and pairing</li>
            <li>step7_final_assembly.py - Final assembly with all tile pools</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
