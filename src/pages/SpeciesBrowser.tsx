import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useSpecies, useStatistics, useSpeciesProteins } from '../hooks/useData';
import Loading from '../components/Loading';
import TileTrack from '../components/TileTrack';
import type { ProteinSummary } from '../types';

type SortKey = 'name' | 'tileCount' | 'uniqueTiles' | 'divergentTiles' | 'similarTiles' | 'length';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | 'unique' | 'divergent' | 'similar' | 'paired' | 'sla' | 'shared';

export default function SpeciesBrowser() {
  const { loading: speciesLoading, error: speciesError } = useSpecies();
  const { statistics, loading: statsLoading } = useStatistics();
  const { proteins: pigProteins, loading: pigLoading, progress } = useSpeciesProteins('pig');

  const [filter, setFilter] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortKey, setSortKey] = useState<SortKey>('tileCount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showTracks, setShowTracks] = useState(false);

  const loading = speciesLoading || statsLoading || pigLoading;
  const error = speciesError;

  const filteredProteins = useMemo(() => {
    let result = pigProteins || [];

    if (filter) {
      const lowerFilter = filter.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(lowerFilter) || p.id.toLowerCase().includes(lowerFilter)
      );
    }

    if (filterType !== 'all') {
      result = result.filter(p => {
        switch (filterType) {
          case 'unique':
            return p.uniqueTiles > 0;
          case 'divergent':
            return p.divergentTiles > 0;
          case 'similar':
            return p.similarTiles > 0;
          case 'paired':
            return (p.similarTiles + p.divergentTiles) > 0;
          case 'sla':
            return (p.slaTiles ?? 0) > 0;
          case 'shared':
            return (p.similarTiles + p.divergentTiles) > 0 && p.uniqueTiles > 0;
          default:
            return true;
        }
      });
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else {
        cmp = (a[sortKey] ?? 0) - (b[sortKey] ?? 0);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [pigProteins, filter, filterType, sortKey, sortOrder]);

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
        <Loading message={progress > 0 ? `Loading proteins... ${progress}%` : 'Loading species data...'} />
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

  const ls = statistics?.library_summary;
  const totalPigTiles = ls?.total_pig_tiles ?? 0;
  const totalHumanTiles = ls?.total_human_tiles ?? 0;
  const uniqueTiles = ls?.unique_tiles ?? 0;
  const divergentTiles = ls?.divergent_tiles ?? 0;
  const similarTiles = ls?.similar_tiles ?? 0;
  const slaTiles = ls?.sla_tiles ?? 0;
  const totalProteins = pigProteins?.length ?? 0;
  const pairedTiles = similarTiles + divergentTiles;

  const filterButtons: { key: FilterType; label: string; count: number; color: string }[] = [
    { key: 'all', label: 'All', count: totalProteins, color: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
    { key: 'paired', label: 'Paired (has human)', count: pairedTiles, color: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300' },
    { key: 'similar', label: 'Similar (80-99%)', count: similarTiles, color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' },
    { key: 'divergent', label: 'Divergent (<80%)', count: divergentTiles, color: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' },
    { key: 'unique', label: 'Pig-only', count: uniqueTiles, color: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' },
    { key: 'sla', label: 'SLA/MHC', count: slaTiles, color: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Pig Tile Library Browser
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Cross-species tiling for xenotransplant rejection epitope discovery. UniProt canonical proteomes, no isoforms.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-3 mb-6">
        <StatCard label="Pig Genes" value={totalProteins} color="text-gray-900 dark:text-white" />
        <StatCard label="Pig Tiles" value={totalPigTiles} color="text-pink-600" />
        <StatCard label="Human Tiles" value={totalHumanTiles} color="text-cyan-600" />
        <StatCard label="Similar" value={similarTiles} color="text-green-600" />
        <StatCard label="Divergent" value={divergentTiles} color="text-yellow-600" />
        <StatCard label="Pig-only" value={uniqueTiles} color="text-red-600" />
        <StatCard label="SLA" value={slaTiles} color="text-purple-600" />
      </div>

      {/* Category legend */}
      <div className="flex items-center gap-4 mb-4 text-xs flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500" /> Similar (80-99% to human)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-500" /> Divergent (&lt;80%)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-600" /> Pig-only (no human ortholog)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-500" /> SLA (pig MHC)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-cyan-500" /> Human ortholog</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-teal-500" /> Control</span>
      </div>

      {/* Filter toggles */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Search by gene name or protein ID..."
          className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showTracks}
            onChange={e => setShowTracks(e.target.checked)}
            className="rounded"
          />
          Show tile tracks
        </label>
      </div>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {filterButtons.map(fb => (
          <button
            key={fb.key}
            onClick={() => setFilterType(fb.key)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors font-medium ${
              filterType === fb.key ? fb.color : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {fb.label}
            <span className="ml-1 opacity-70">{fb.count.toLocaleString()}</span>
          </button>
        ))}
      </div>

      {/* Sort buttons */}
      <div className="mb-2 flex gap-2 text-xs items-center">
        <span className="text-gray-500">Sort:</span>
        {([
          ['name', 'Name'],
          ['tileCount', 'Total tiles'],
          ['similarTiles', 'Similar'],
          ['divergentTiles', 'Divergent'],
          ['uniqueTiles', 'Pig-only'],
          ['length', 'Length'],
        ] as [SortKey, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => handleSort(key)}
            className={`px-2 py-1 rounded ${
              sortKey === key
                ? 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            {label}
            {sortKey === key && <span className="ml-1">{sortOrder === 'asc' ? '\u2191' : '\u2193'}</span>}
          </button>
        ))}
        <span className="ml-auto text-gray-500">{filteredProteins.length.toLocaleString()} genes</span>
      </div>

      {/* Protein list */}
      <VirtualProteinList proteins={filteredProteins} showTracks={showTracks} />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
      <div className={`text-xl font-bold ${color}`}>{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

function CategoryBar({ protein }: { protein: ProteinSummary }) {
  const total = protein.tileCount || 1;
  const segments: { count: number; color: string; label: string }[] = [
    { count: protein.similarTiles, color: 'bg-green-500', label: 'similar' },
    { count: protein.divergentTiles, color: 'bg-yellow-500', label: 'divergent' },
    { count: protein.uniqueTiles, color: 'bg-red-600', label: 'unique' },
    { count: protein.slaTiles ?? 0, color: 'bg-purple-500', label: 'sla' },
  ].filter(s => s.count > 0);

  return (
    <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 w-full" title={
      segments.map(s => `${s.label}: ${s.count} (${(s.count/total*100).toFixed(0)}%)`).join(', ')
    }>
      {segments.map(s => (
        <div
          key={s.label}
          className={s.color}
          style={{ width: `${(s.count / total) * 100}%` }}
        />
      ))}
    </div>
  );
}

function VirtualProteinList({ proteins, showTracks }: { proteins: ProteinSummary[]; showTracks: boolean }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: proteins.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => showTracks ? 120 : 80,
    overscan: 15,
  });

  if (proteins.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-8 text-center text-gray-500">
        No proteins match your filter
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-auto"
      style={{ height: 'min(72vh, 850px)' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map(virtualRow => {
          const protein = proteins[virtualRow.index];
          const hasPaired = (protein.similarTiles + protein.divergentTiles) > 0;
          const hasUnique = protein.uniqueTiles > 0;

          return (
            <div
              key={protein.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <Link
                to={`/protein/${protein.id}`}
                className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors h-full border-b border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Row 1: name + badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-sm">
                        {protein.nameClean}
                      </span>
                      {hasPaired && (
                        <span className="shrink-0 px-1.5 py-0.5 bg-cyan-50 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-[10px] rounded font-medium">
                          {protein.similarTiles + protein.divergentTiles} paired
                        </span>
                      )}
                      {hasUnique && (
                        <span className="shrink-0 px-1.5 py-0.5 bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[10px] rounded font-medium">
                          {protein.uniqueTiles} pig-only
                        </span>
                      )}
                      {(protein.slaTiles ?? 0) > 0 && (
                        <span className="shrink-0 px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] rounded font-medium">
                          SLA
                        </span>
                      )}
                      {protein.isoformCount > 1 && (
                        <span className="shrink-0 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-[10px] rounded">
                          {protein.isoformCount} isoforms
                        </span>
                      )}
                    </div>

                    {/* Row 2: ID + stats */}
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-mono text-[10px]">{protein.id}</span>
                      <span>{protein.length} aa</span>
                      <span>{protein.tileCount} tiles</span>
                      <span>{protein.coveragePct}% cov</span>
                    </div>

                    {/* Row 3: category bar */}
                    <div className="mt-1.5 w-full max-w-md">
                      <CategoryBar protein={protein} />
                    </div>

                    {/* Row 4: optional tile track */}
                    {showTracks && protein.tiles && protein.tiles.length > 0 && (
                      <div className="mt-1">
                        <TileTrack
                          tiles={protein.tiles}
                          proteinLength={protein.length}
                          height={30}
                          compact
                        />
                      </div>
                    )}
                  </div>

                  <svg className="w-4 h-4 text-gray-400 shrink-0 self-center" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
