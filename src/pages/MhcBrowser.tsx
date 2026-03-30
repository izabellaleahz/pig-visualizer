import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMhcSummary } from '../hooks/useData';
import Loading from '../components/Loading';

type SortKey = 'locus' | 'alleles' | 'tiles' | 'identity' | 'hlaAlleles';

export default function MhcBrowser() {
  const { loci, loading, error } = useMhcSummary();
  const [classFilter, setClassFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('locus');

  const filtered = useMemo(() => {
    let result = loci;
    if (classFilter !== 'all') {
      result = result.filter(l => l.class === classFilter);
    }
    return [...result].sort((a, b) => {
      switch (sortKey) {
        case 'locus': return a.id.localeCompare(b.id);
        case 'alleles': return b.alleleCount - a.alleleCount;
        case 'tiles': return b.tileCount - a.tileCount;
        case 'identity': return (b.meanIdentity ?? 0) - (a.meanIdentity ?? 0);
        case 'hlaAlleles': return b.hlaAlleleCount - a.hlaAlleleCount;
        default: return 0;
      }
    });
  }, [loci, classFilter, sortKey]);

  const totalSla = loci.reduce((s, l) => s + l.tileCount, 0);
  const totalHla = loci.reduce((s, l) => s + l.hlaTileCount, 0);
  const totalPaired = loci.reduce((s, l) => s + l.pairedTiles, 0);

  if (loading) return <Loading message="Loading MHC data..." />;
  if (error) return <div className="p-8 text-red-600">Error: {error.message}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">MHC / HLA-SLA Comparison</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Top 100 HLA alleles (by global frequency) paired with all SLA alleles. Sequences sourced from UniProt + IMGT/HLA.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600">{loci.length}</div>
          <div className="text-xs text-gray-500">SLA Loci</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600">{loci.reduce((s, l) => s + l.alleleCount, 0)}</div>
          <div className="text-xs text-gray-500">SLA Alleles</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600">{totalSla.toLocaleString()}</div>
          <div className="text-xs text-gray-500">SLA Tiles</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600">{totalHla.toLocaleString()}</div>
          <div className="text-xs text-gray-500">HLA Tiles</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">{totalPaired.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Paired Tiles</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-gray-500">Class:</span>
        {['all', 'I', 'II'].map(cls => (
          <button
            key={cls}
            onClick={() => setClassFilter(cls)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              classFilter === cls
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {cls === 'all' ? 'All' : `Class ${cls}`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              {[
                { key: 'locus' as SortKey, label: 'SLA Locus' },
                { key: 'locus' as SortKey, label: 'HLA Ortholog' },
                { key: 'locus' as SortKey, label: 'Class' },
                { key: 'alleles' as SortKey, label: 'SLA Alleles' },
                { key: 'hlaAlleles' as SortKey, label: 'HLA Alleles' },
                { key: 'tiles' as SortKey, label: 'SLA Tiles' },
                { key: 'identity' as SortKey, label: 'Mean Identity' },
              ].map(col => (
                <th
                  key={col.label}
                  className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900"
                  onClick={() => setSortKey(col.key)}
                >
                  {col.label}
                  {sortKey === col.key && ' *'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(locus => (
              <tr
                key={locus.id}
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
              >
                <td className="px-4 py-3">
                  <Link
                    to={`/mhc/${locus.id}`}
                    className="text-purple-600 hover:text-purple-800 font-medium"
                  >
                    {locus.id}
                  </Link>
                </td>
                <td className="px-4 py-3 text-blue-600">
                  {locus.ortholog || '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    locus.class === 'I'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  }`}>
                    {locus.class}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{locus.alleleCount}</td>
                <td className="px-4 py-3 text-right">{locus.hlaAlleleCount}</td>
                <td className="px-4 py-3 text-right">{locus.tileCount.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  {locus.meanIdentity != null ? (
                    <span className={
                      locus.meanIdentity >= 0.85 ? 'text-green-600' :
                      locus.meanIdentity >= 0.7 ? 'text-yellow-600' :
                      locus.meanIdentity >= 0.5 ? 'text-orange-600' : 'text-red-600'
                    }>
                      {(locus.meanIdentity * 100).toFixed(1)}%
                    </span>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
