import { useStatistics } from '../hooks/useData';
import { useMhcStatistics } from '../hooks/useData';
import Loading from '../components/Loading';

export default function Statistics() {
  const { statistics, loading, error } = useStatistics();
  const { statistics: mhcStats, loading: mhcLoading } = useMhcStatistics();

  if (loading || mhcLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Loading message="Loading statistics..." />
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error ? `Error loading data: ${error.message}` : 'Statistics not found'}
        </div>
      </div>
    );
  }

  const { library_summary, coverage, generation_info } = statistics;
  const total = library_summary.total_pig_tiles || 1;

  const categories = [
    { label: 'Similar (80-99% to human)', color: 'bg-green-500', count: library_summary.similar_tiles || 0 },
    { label: 'Divergent (<80% to human)', color: 'bg-yellow-500', count: library_summary.divergent_tiles || 0 },
    { label: 'Pig-only (no ortholog)', color: 'bg-red-600', count: library_summary.unique_tiles || 0 },
    { label: 'SLA (pig MHC)', color: 'bg-purple-500', count: library_summary.sla_tiles || 0 },
  ].filter(c => c.count > 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Library Statistics</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Pig-human cross-species tile library for xenotransplant rejection epitope discovery
        </p>
      </div>

      {/* Key Numbers */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <StatCard label="Total Tiles" value={library_summary.total_sequences || 0} color="text-gray-900 dark:text-white" />
        <StatCard label="Pig Tiles" value={library_summary.total_pig_tiles || 0} color="text-pink-600" />
        <StatCard label="Human Tiles" value={library_summary.total_human_tiles || 0} color="text-cyan-600" />
        <StatCard label="Controls" value={library_summary.controls?.total || 0} color="text-teal-600" />
        <StatCard label="Pig Genes" value={library_summary.pig_proteins || 0} color="text-gray-700 dark:text-gray-300" />
        <StatCard label="Excluded (100% ID)" value={library_summary.excluded_identical || 0} color="text-gray-400" />
      </div>

      {/* Pig Tile Categories */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pig Tile Categories</h2>

        {/* Bar */}
        <div className="flex h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 mb-4">
          {categories.map(c => (
            <div key={c.label} className={c.color} style={{ width: `${Math.max((c.count / total) * 100, 0.3)}%` }}
              title={`${c.label}: ${c.count.toLocaleString()}`} />
          ))}
        </div>

        {/* Legend */}
        <div className="grid md:grid-cols-2 gap-2">
          {categories.map(c => (
            <div key={c.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${c.color}`} />
                <span className="text-sm text-gray-600 dark:text-gray-400">{c.label}</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {c.count.toLocaleString()} ({((c.count / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>

        {/* Human tile breakdown */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Human Counterpart Tiles</h3>
          <div className="grid md:grid-cols-2 gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-cyan-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Human orthologs (paired)</span>
              </div>
              <span className="text-sm font-medium">{((library_summary.total_human_tiles || 0) - (library_summary.hla_tiles || 0)).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">HLA (human MHC)</span>
              </div>
              <span className="text-sm font-medium">{(library_summary.hla_tiles || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Controls section */}
        {library_summary.controls && library_summary.controls.total > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Control Oligos</h3>
            <div className="grid md:grid-cols-2 gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-teal-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Peptide controls (GFAP, MYC)</span>
                </div>
                <span className="text-sm font-medium">{library_summary.controls.peptide_controls}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-teal-300 dark:bg-teal-700" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Stop codon phages (empty)</span>
                </div>
                <span className="text-sm font-medium">{library_summary.controls.stop_codon_phages}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MHC / SLA-HLA Section */}
      {mhcStats && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            MHC: SLA / HLA Comparison
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* SLA (pig) */}
            <div>
              <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-3 uppercase tracking-wide">SLA (Pig MHC)</h3>
              <div className="space-y-2 text-sm">
                <Row label="Source" value="IPD-MHC (all alleles, no cutoff)" />
                <Row label="Raw alleles fetched" value={mhcStats.sla.rawAlleles.toLocaleString()} />
                <Row label="Parsed with sequence" value={mhcStats.sla.parsedAlleles.toLocaleString()} />
                <Row label="Unique proteins" value={mhcStats.sla.uniqueProteins.toLocaleString()} />
                <Row label="Total SLA tiles" value={mhcStats.sla.totalTiles.toLocaleString()} />
                <Row label="Tiles with HLA pair" value={`${mhcStats.sla.tilesWithHlaPair.toLocaleString()} (${((mhcStats.sla.tilesWithHlaPair / mhcStats.sla.totalTiles) * 100).toFixed(0)}%)`} />
                <Row label="Mean SLA-HLA identity" value={`${(mhcStats.sla.meanIdentity * 100).toFixed(1)}%`} />
              </div>

              {/* Class breakdown */}
              {mhcStats.sla.classDistribution && Object.keys(mhcStats.sla.classDistribution).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 mb-1">SLA tiles by class:</div>
                  {Object.entries(mhcStats.sla.classDistribution).map(([cls, count]) => (
                    <div key={cls} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Class {cls}</span>
                      <span>{(count as number).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Gene breakdown */}
              {mhcStats.sla.geneCounts && Object.keys(mhcStats.sla.geneCounts).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 mb-1">SLA tiles by locus:</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    {Object.entries(mhcStats.sla.geneCounts)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([gene, count]) => (
                        <div key={gene} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                          <span>{gene}</span>
                          <span>{(count as number).toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* HLA (human) */}
            <div>
              <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">HLA (Human MHC)</h3>
              <div className="space-y-2 text-sm">
                <Row label="Source" value={mhcStats.hla.source} />
                <Row label="Classical alleles" value={`Top ${mhcStats.topNHla} by frequency`} />
                <Row label="Matched alleles" value={mhcStats.hla.matchedAlleles.toLocaleString()} />
                <Row label="Unique proteins" value={mhcStats.hla.uniqueProteins.toLocaleString()} />
                <Row label="Total HLA tiles" value={mhcStats.hla.totalTiles.toLocaleString()} />
              </div>

              {/* Locus breakdown */}
              {mhcStats.hla.locusCounts && Object.keys(mhcStats.hla.locusCounts).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 mb-1">HLA tiles by locus:</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    {Object.entries(mhcStats.hla.locusCounts)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([locus, count]) => (
                        <div key={locus} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                          <span>HLA-{locus}</span>
                          <span>{(count as number).toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* UniProt genes */}
              {mhcStats.hla.uniprotGenes && Object.keys(mhcStats.hla.uniprotGenes).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 mb-1">UniProt gene accessions:</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(mhcStats.hla.uniprotGenes).map(([locus, acc]) => (
                      <a key={locus} href={`https://www.uniprot.org/uniprot/${acc}`} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:underline">
                        {locus}: {acc as string}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pairing stats */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SLA &harr; HLA Pairing</h3>
            <div className="grid md:grid-cols-4 gap-3">
              <MiniStat label="Total pairs" value={mhcStats.pairing.totalPairs.toLocaleString()} />
              <MiniStat label="Mean identity" value={`${(mhcStats.pairing.meanIdentity * 100).toFixed(1)}%`} />
              <MiniStat label="Paired" value={mhcStats.pairing.paired.toLocaleString()} />
              <MiniStat label="Unpaired" value={mhcStats.pairing.unpaired.toLocaleString()} />
            </div>

            {/* Identity distribution */}
            {mhcStats.identityDistribution && Object.keys(mhcStats.identityDistribution).length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-1">Identity distribution:</div>
                <div className="flex items-end gap-1 h-16">
                  {Object.entries(mhcStats.identityDistribution)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                    .map(([bucket, count]) => {
                      const maxCount = Math.max(...Object.values(mhcStats.identityDistribution).map(Number));
                      const height = ((count as number) / maxCount) * 100;
                      const lo = parseInt(bucket);
                      return (
                        <div key={bucket} className="flex-1 flex flex-col items-center">
                          <div
                            className={`w-full rounded-t ${lo >= 85 ? 'bg-green-500' : lo >= 70 ? 'bg-yellow-500' : lo >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                            style={{ height: `${height}%` }}
                            title={`${bucket}%: ${(count as number).toLocaleString()} pairs`}
                          />
                          <span className="text-[8px] text-gray-400 mt-0.5">{lo}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Coverage */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Coverage</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="text-2xl font-bold text-emerald-600">{coverage?.proteins_with_full_coverage?.toLocaleString() ?? 'N/A'}</div>
            <div className="text-sm text-gray-500">100% Coverage</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-600">{coverage?.proteins_with_partial_coverage?.toLocaleString() ?? 'N/A'}</div>
            <div className="text-sm text-gray-500">Partial Coverage</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{coverage?.mean_coverage_pct?.toFixed(1) ?? 'N/A'}%</div>
            <div className="text-sm text-gray-500">Mean Coverage</div>
          </div>
        </div>
      </div>

      {/* Generation Parameters */}
      {generation_info && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pipeline Parameters</h2>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            {Object.entries(generation_info).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-500">{key.replace(/_/g, ' ')}</span>
                <span className="font-medium text-gray-900 dark:text-white">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
      <div className="text-lg font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
