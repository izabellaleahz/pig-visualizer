import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProtein } from '../hooks/useData';
import Loading from '../components/Loading';
import TileTrack from '../components/TileTrack';
import TileDetail from '../components/TileDetail';
import type { TilePosition, TileCategory } from '../types';

type FilterType = 'all' | 'unique' | 'unique_with_homolog' | 'divergent' | 'similar';

export default function ProteinDetail() {
  const { proteinId } = useParams<{ proteinId: string }>();
  const { protein, speciesId, loading, error } = useProtein(proteinId);
  const [selectedTile, setSelectedTile] = useState<TilePosition | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Filter tiles
  const filteredTiles = useMemo(() => {
    if (!protein || !protein.tiles) return [];
    if (filterType === 'all') return protein.tiles;
    return protein.tiles.filter(t => t.category === filterType);
  }, [protein, filterType]);

  // Calculate coverage depth
  const coverageDepth = useMemo(() => {
    if (!protein || !protein.tiles) return [];
    const depth = new Array(protein.length).fill(0);
    for (const tile of protein.tiles) {
      for (let i = tile.start; i < tile.end && i < protein.length; i++) {
        depth[i]++;
      }
    }
    return depth;
  }, [protein]);

  const maxDepth = Math.max(...coverageDepth, 1);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Loading message="Loading protein details..." />
      </div>
    );
  }

  if (error || !protein || !speciesId) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error ? `Error loading data: ${error.message}` : 'Protein not found'}
        </div>
      </div>
    );
  }

  const speciesName = speciesId === 'pig' ? 'Pig (Sus scrofa)' : 'Human (Homo sapiens)';

  const getCategoryColor = (category: TileCategory) => {
    switch (category) {
      case 'unique': return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
      case 'unique_with_homolog': return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300';
      case 'divergent': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
      case 'similar': return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'sla': return 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300';
      case 'hla': return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      case 'human_ortholog': return 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300';
      default: return 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300';
    }
  };

  const getCategoryLabel = (category: TileCategory) => {
    switch (category) {
      case 'unique': return 'Unique';
      case 'unique_with_homolog': return 'Unique+H';
      case 'divergent': return 'Divergent';
      case 'similar': return 'Similar';
      case 'sla': return 'SLA';
      case 'hla': return 'HLA';
      case 'human_ortholog': return 'Human';
      default: return 'Unknown';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm">
        <Link to="/" className="text-pink-600 dark:text-pink-400 hover:underline">
          Species
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <Link to={`/species/${speciesId}`} className="text-pink-600 dark:text-pink-400 hover:underline">
          {speciesName}
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-600 dark:text-gray-300">{protein.nameClean}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
          speciesId === 'pig' ? 'bg-pink-100 dark:bg-pink-900' : 'bg-blue-100 dark:bg-blue-900'
        }`}>
          {speciesId === 'pig' ? '🐷' : '🧑'}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {protein.nameClean}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-mono">{protein.id}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {speciesName}
            {protein.isoformCount > 1 && (
              <span className="ml-2 text-gray-400 dark:text-gray-500">
                (representative of {protein.isoformCount} isoforms)
              </span>
            )}
          </p>
          {/* External database links */}
          <div className="flex gap-3 mt-2">
            {protein.ncbiLink && (
              <a
                href={protein.ncbiLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                NCBI
              </a>
            )}
            {protein.uniprotLink && (
              <a
                href={protein.uniprotLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                UniProt
              </a>
            )}
          </div>
          {/* Isoform list */}
          {protein.isoformIds && protein.isoformIds.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                {protein.isoformIds.length} other isoform{protein.isoformIds.length > 1 ? 's' : ''} collapsed into this entry
              </summary>
              <div className="mt-1 flex flex-wrap gap-1">
                {protein.isoformIds.map(id => (
                  <a
                    key={id}
                    href={`https://www.ncbi.nlm.nih.gov/protein/${id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {id}
                  </a>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {protein.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Length (aa)</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {protein.tileCount}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Tiles</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {protein.uniqueTiles}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Unique</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {protein.divergentTiles}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Divergent</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {protein.similarTiles}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Similar</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {protein.coveragePct}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Coverage</div>
        </div>
      </div>

      {/* Tile Track */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tile Coverage
          </h2>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-600" />
              <span className="text-gray-600 dark:text-gray-400">Unique</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span className="text-gray-600 dark:text-gray-400">Unique+H</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span className="text-gray-600 dark:text-gray-400">Divergent</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-gray-600 dark:text-gray-400">Similar</span>
            </div>
          </div>
        </div>
        {protein.tiles && protein.tiles.length > 0 && (
          <TileTrack
            tiles={protein.tiles}
            proteinLength={protein.length}
            onTileClick={setSelectedTile}
            height={100}
          />
        )}
      </div>

      {/* Coverage Depth */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Coverage Depth
        </h2>
        <div className="h-16 relative">
          <svg className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="depthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path
              d={`M 0 ${64} ${coverageDepth
                .map((d, i) => {
                  const x = (i / protein.length) * 100;
                  const y = 64 - (d / maxDepth) * 60;
                  return `L ${x}% ${y}`;
                })
                .join(' ')} L 100% 64 Z`}
              fill="url(#depthGradient)"
            />
          </svg>
          <div className="absolute top-0 left-0 text-xs text-gray-500 dark:text-gray-400">
            Max: {maxDepth}x
          </div>
        </div>
      </div>

      {/* Protein Sequence */}
      {protein.sequence && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Protein Sequence
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">{protein.length} aa</span>
          </div>
          <div className="font-mono text-xs leading-relaxed overflow-x-auto">
            <div className="whitespace-pre-wrap break-all">
              {protein.sequence.split('').map((aa, i) => {
                const isUnknown = ['X', 'B', 'Z', 'J', 'U', 'O'].includes(aa);
                const showLineNum = i % 60 === 0;
                return (
                  <span key={i}>
                    {showLineNum && (
                      <span className="text-gray-400 dark:text-gray-500 select-none mr-2">
                        {String(i + 1).padStart(5, ' ')}
                      </span>
                    )}
                    <span
                      className={isUnknown
                        ? 'text-red-600 dark:text-red-400 font-bold bg-red-100 dark:bg-red-900/50'
                        : 'text-gray-700 dark:text-gray-300'
                      }
                    >
                      {aa}
                    </span>
                    {(i + 1) % 60 === 0 && i < (protein.sequence?.length ?? 0) - 1 && '\n'}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tile List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tiles ({filteredTiles.length})
          </h2>
          <div className="flex gap-1 flex-wrap">
            {(['all', 'unique', 'divergent', 'similar'] as FilterType[]).map(f => {
              const count = f === 'all'
                ? (protein.tiles?.length ?? 0)
                : f === 'unique'
                ? protein.uniqueTiles + protein.uniqueWithHomologTiles
                : f === 'divergent'
                ? protein.divergentTiles
                : protein.similarTiles;

              return (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filterType === f
                      ? f === 'unique'
                        ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                        : f === 'divergent'
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                        : f === 'similar'
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'unique' ? 'Unique' : f === 'divergent' ? 'Divergent' : 'Similar'} ({count})
                </button>
              );
            })}
          </div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
          {filteredTiles.map(tile => (
            <button
              key={tile.id}
              onClick={() => setSelectedTile(tile)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white font-mono truncate">
                      {tile.id}
                    </span>
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-xs ${getCategoryColor(tile.category)}`}>
                      {getCategoryLabel(tile.category)}
                    </span>
                    {tile.maxIdentity != null && (
                      <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                        {tile.maxIdentity.toFixed(1)}% ID
                      </span>
                    )}
                    {tile.sharedGeneCount && tile.sharedGeneCount > 1 && (
                      <span className="shrink-0 px-1.5 py-0.5 rounded text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
                        {tile.sharedGeneCount} genes
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono truncate">
                    {tile.seq}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 text-right shrink-0">
                  <div>{tile.start} - {tile.end}</div>
                  <div>{tile.end - tile.start} aa</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tile Detail Modal */}
      {selectedTile && (
        <TileDetail
          tile={selectedTile}
          currentProteinId={protein.id}
          onClose={() => setSelectedTile(null)}
        />
      )}
    </div>
  );
}
