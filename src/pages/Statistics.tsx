import { useStatistics } from '../hooks/useData';
import Loading from '../components/Loading';

export default function Statistics() {
  const { statistics, loading, error } = useStatistics();

  if (loading) {
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

  const { library_summary, coverage, generation_info, identity_stats } = statistics;

  // Calculate percentages for the category bar
  const total = library_summary.total_pig_tiles || 1;
  const uniquePct = ((library_summary.unique_tiles || 0) / total) * 100;
  const uniqueHomologPct = ((library_summary.unique_with_homolog_tiles || 0) / total) * 100;
  const divergentPct = ((library_summary.divergent_tiles || 0) / total) * 100;
  const similarPct = ((library_summary.similar_tiles || 0) / total) * 100;
  const slaPct = ((library_summary.sla_tiles || 0) / total) * 100;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Library Statistics
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Pig tile library for xenotransplant rejection epitope discovery
        </p>
      </div>

      {/* Key Numbers */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {(library_summary.total_sequences || 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Sequences</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">
            {(library_summary.total_pig_tiles || 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Pig Tiles</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {(library_summary.total_human_tiles || 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Human Tiles</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-3xl font-bold text-gray-400">
            {(library_summary.excluded_identical || 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Excluded (100% ID)</div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Tile Categories
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Visual breakdown bar */}
          <div>
            <div className="flex h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 mb-4">
              <div
                className="bg-red-600"
                style={{ width: `${uniquePct}%` }}
                title={`Unique: ${(library_summary.unique_tiles || 0).toLocaleString()}`}
              />
              <div
                className="bg-orange-500"
                style={{ width: `${uniqueHomologPct}%` }}
                title={`Unique w/ Homolog: ${(library_summary.unique_with_homolog_tiles || 0).toLocaleString()}`}
              />
              <div
                className="bg-yellow-500"
                style={{ width: `${divergentPct}%` }}
                title={`Divergent: ${(library_summary.divergent_tiles || 0).toLocaleString()}`}
              />
              <div
                className="bg-green-500"
                style={{ width: `${similarPct}%` }}
                title={`Similar: ${(library_summary.similar_tiles || 0).toLocaleString()}`}
              />
              {slaPct > 0 && (
                <div
                  className="bg-purple-500"
                  style={{ width: `${Math.max(slaPct, 0.5)}%` }}
                  title={`SLA: ${(library_summary.sla_tiles || 0).toLocaleString()}`}
                />
              )}
            </div>

            {/* Legend */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-600" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Unique (no homolog)</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {(library_summary.unique_tiles || 0).toLocaleString()} ({uniquePct.toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Unique w/ homolog</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {(library_summary.unique_with_homolog_tiles || 0).toLocaleString()} ({uniqueHomologPct.toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Divergent (&lt;80%)</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {(library_summary.divergent_tiles || 0).toLocaleString()} ({divergentPct.toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Similar (80-99%)</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {(library_summary.similar_tiles || 0).toLocaleString()} ({similarPct.toFixed(1)}%)
                </span>
              </div>
              {(library_summary.sla_tiles || 0) > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-purple-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">SLA (pig MHC)</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {(library_summary.sla_tiles || 0).toLocaleString()} ({slaPct.toFixed(1)}%)
                  </span>
                </div>
              )}
              {(library_summary.human_ortholog_tiles || 0) > 0 && (
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-cyan-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Human orthologs</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {(library_summary.human_ortholog_tiles || 0).toLocaleString()}
                  </span>
                </div>
              )}
              {(library_summary.hla_tiles || 0) > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">HLA (human MHC)</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {(library_summary.hla_tiles || 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Protein Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {(library_summary.pig_proteins || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Pig Proteins</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {(library_summary.human_proteins || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Human Proteins</div>
            </div>
            {identity_stats && (
              <>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {identity_stats.tiles_with_human_match?.toLocaleString() ?? 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Tiles with Human Match</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {identity_stats.mean_identity?.toFixed(1) ?? 'N/A'}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Mean Identity</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Coverage Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Coverage Statistics
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {coverage?.proteins_with_full_coverage?.toLocaleString() ?? 'N/A'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Proteins with 100% Coverage</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {coverage?.proteins_with_partial_coverage?.toLocaleString() ?? 'N/A'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Proteins with Partial Coverage</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {coverage?.mean_coverage_pct?.toFixed(1) ?? 'N/A'}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Mean Coverage</div>
          </div>
        </div>
      </div>

      {/* Generation Info */}
      {generation_info && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Generation Parameters
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {generation_info.pipeline && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Pipeline</div>
                <div className="text-gray-900 dark:text-white font-medium">{generation_info.pipeline}</div>
              </div>
            )}
            {generation_info.method && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Method</div>
                <div className="text-gray-900 dark:text-white font-medium">{generation_info.method}</div>
              </div>
            )}
            {generation_info.tile_length && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Tile Length</div>
                <div className="text-gray-900 dark:text-white font-medium">{generation_info.tile_length} aa</div>
              </div>
            )}
            {generation_info.tile_overlap && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Tile Overlap</div>
                <div className="text-gray-900 dark:text-white font-medium">{generation_info.tile_overlap} aa</div>
              </div>
            )}
            {generation_info.clustering_threshold && (
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Clustering Threshold</div>
                <div className="text-gray-900 dark:text-white font-medium">{(generation_info.clustering_threshold * 100).toFixed(0)}%</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
