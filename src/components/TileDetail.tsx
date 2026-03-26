import type { TilePosition, TileCategory } from '../types';

interface TileDetailProps {
  tile: TilePosition;
  currentProteinId: string;
  onClose: () => void;
}

function getCategoryLabel(category: TileCategory): string {
  switch (category) {
    case 'unique':
      return 'Unique (no human homolog)';
    case 'unique_with_homolog':
      return 'Unique with homolog (alignment failed)';
    case 'divergent':
      return 'Divergent (<80% identity)';
    case 'similar':
      return 'Similar (80-99% identity)';
    case 'sla':
      return 'SLA (pig MHC allele)';
    case 'hla':
      return 'HLA (human MHC allele)';
    case 'human_ortholog':
      return 'Human ortholog';
    default:
      return 'Unknown';
  }
}

function getCategoryBadgeClass(category: TileCategory): string {
  switch (category) {
    case 'unique':
      return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
    case 'unique_with_homolog':
      return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300';
    case 'divergent':
      return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
    case 'similar':
      return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
    case 'sla':
      return 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300';
    case 'hla':
      return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
    case 'human_ortholog':
      return 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300';
    default:
      return 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300';
  }
}

export default function TileDetail({ tile, currentProteinId, onClose }: TileDetailProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tile Details
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              {tile.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Tile info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Position</div>
              <div className="text-lg font-medium text-gray-900 dark:text-white">
                {tile.start} - {tile.end}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {tile.end - tile.start} aa
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Category</div>
              <div className="mt-1">
                <span className={`px-2 py-1 rounded text-sm font-medium ${getCategoryBadgeClass(tile.category)}`}>
                  {getCategoryLabel(tile.category)}
                </span>
              </div>
            </div>
          </div>

          {/* Sharing info */}
          {tile.sharedGeneCount && tile.sharedGeneCount > 1 && (
            <div className="mb-6">
              <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-4">
                <div className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Shared across {tile.sharedGeneCount} genes
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  This tile sequence appears in {tile.sharedGeneCount} different gene families
                </div>
              </div>
            </div>
          )}

          {/* Identity info */}
          {tile.maxIdentity != null && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Human Homolog Identity
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tile.maxIdentity.toFixed(1)}%
                </div>
                {tile.humanMatchCount && tile.humanMatchCount > 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {tile.humanMatchCount} human match{tile.humanMatchCount > 1 ? 'es' : ''}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Human matches */}
          {tile.humanMatches && tile.humanMatches.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Human Matches
              </h3>
              <div className="space-y-2">
                {tile.humanMatches.map((match, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {match.name || match.proteinId}
                      </span>
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {match.identity.toFixed(1)}% identity
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-1">
                      {match.proteinId}
                    </div>
                    <div className="font-mono text-xs text-gray-500 dark:text-gray-400 break-all">
                      {match.tile}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sequence */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pig Tile Sequence
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm break-all">
              {tile.seq}
            </div>
          </div>

          {/* Current protein info */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Viewing in context of protein: <span className="font-mono">{currentProteinId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
