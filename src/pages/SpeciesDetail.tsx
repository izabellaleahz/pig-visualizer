import { useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useSpeciesProteins } from '../hooks/useData';
import Loading from '../components/Loading';
import type { SpeciesId, ProteinSummary } from '../types';

type SortKey = 'name' | 'tileCount' | 'uniqueTiles' | 'divergentTiles' | 'length';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | 'unique' | 'divergent' | 'similar' | 'sla';

// Memoized protein row component
function ProteinRow({ protein }: { protein: ProteinSummary }) {
  return (
    <Link
      to={`/protein/${protein.id}`}
      className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors border-b border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {protein.nameClean}
            </span>
            {protein.uniqueTiles > 0 && (
              <span className="shrink-0 px-1.5 py-0.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs rounded">
                {protein.uniqueTiles} unique
              </span>
            )}
            {protein.divergentTiles > 0 && (
              <span className="shrink-0 px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs rounded">
                {protein.divergentTiles} divergent
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {protein.id}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>{protein.length.toLocaleString()} aa</span>
            <span>{protein.tileCount} tiles</span>
            <span>{protein.coveragePct}% coverage</span>
          </div>
        </div>
        <svg className="w-5 h-5 text-gray-400 shrink-0 self-center" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

export default function SpeciesDetail() {
  const { speciesId } = useParams<{ speciesId: string }>();
  const { proteins, loading, error, progress } = useSpeciesProteins(speciesId as SpeciesId);
  const [filter, setFilter] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortKey, setSortKey] = useState<SortKey>('uniqueTiles');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const parentRef = useRef<HTMLDivElement>(null);

  const speciesName = speciesId === 'pig' ? 'Pig (Sus scrofa)' : 'Human (Homo sapiens)';

  // Filter and sort proteins
  const filteredProteins = useMemo(() => {
    let result = proteins;

    // Text filter - search in name, nameClean, and id
    if (filter) {
      const lowerFilter = filter.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(lowerFilter) ||
             p.nameClean.toLowerCase().includes(lowerFilter) ||
             p.id.toLowerCase().includes(lowerFilter)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      result = result.filter(p => {
        switch (filterType) {
          case 'unique':
            return p.uniqueTiles > 0;
          case 'divergent':
            return p.divergentTiles > 0;
          case 'similar':
            return p.similarTiles > 0;
          case 'sla':
            return (p.slaTiles ?? 0) > 0;
          default:
            return true;
        }
      });
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = (a.nameClean || a.name).localeCompare(b.nameClean || b.name);
      } else {
        cmp = (a[sortKey] || 0) - (b[sortKey] || 0);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [proteins, filter, filterType, sortKey, sortOrder]);

  // Virtual list for performance with 62k+ proteins
  const virtualizer = useVirtualizer({
    count: filteredProteins.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 85, // Approximate row height
    overscan: 10, // Render 10 extra items above/below viewport
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder(key === 'name' ? 'asc' : 'desc');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Loading message={`Loading ${speciesName} proteins...`} progress={progress} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg">
          Error loading data: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm">
        <Link to="/" className="text-pink-600 dark:text-pink-400 hover:underline">
          Species
        </Link>
        <span className="mx-2 text-gray-400">/</span>
        <span className="text-gray-600 dark:text-gray-300">{speciesName}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-4xl ${
          speciesId === 'pig' ? 'bg-pink-100 dark:bg-pink-900' : 'bg-blue-100 dark:bg-blue-900'
        }`}>
          {speciesId === 'pig' ? '🐷' : '🧑'}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {speciesName}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {proteins.length.toLocaleString()} proteins
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Search by gene name or accession ID..."
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'unique', 'divergent', 'similar', 'sla'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                filterType === f
                  ? f === 'unique'
                    ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                    : f === 'divergent'
                    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                    : f === 'similar'
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                    : f === 'sla'
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? 'All' : f === 'unique' ? 'Unique' : f === 'divergent' ? 'Divergent' : f === 'similar' ? 'Similar' : 'SLA'}
            </button>
          ))}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 self-center">
          {filteredProteins.length.toLocaleString()} results
        </div>
      </div>

      {/* Sort buttons */}
      <div className="mb-2 flex gap-2 text-xs">
        <span className="text-gray-500 dark:text-gray-400 self-center">Sort by:</span>
        {(['name', 'tileCount', 'uniqueTiles', 'divergentTiles', 'length'] as SortKey[]).map(key => (
          <button
            key={key}
            onClick={() => handleSort(key)}
            className={`px-2 py-1 rounded ${
              sortKey === key
                ? 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {key === 'name' ? 'Name' : key === 'tileCount' ? 'Tiles' : key === 'uniqueTiles' ? 'Unique' : key === 'divergentTiles' ? 'Divergent' : 'Length'}
            {sortKey === key && (
              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
        ))}
      </div>

      {/* Virtualized protein list */}
      <div
        ref={parentRef}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto"
        style={{ height: '600px' }}
      >
        {filteredProteins.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            No proteins match your filter
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map(virtualRow => {
              const protein = filteredProteins[virtualRow.index];
              return (
                <div
                  key={protein.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <ProteinRow protein={protein} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
