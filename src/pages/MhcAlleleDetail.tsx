import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMhcLocus } from '../hooks/useData';
import Loading from '../components/Loading';

function identityColorClass(id: number): string {
  if (id >= 0.85) return 'bg-green-500';
  if (id >= 0.7) return 'bg-yellow-500';
  if (id >= 0.5) return 'bg-orange-500';
  return 'bg-red-500';
}

export default function MhcAlleleDetail() {
  const { locusId, alleleId } = useParams<{ locusId: string; alleleId: string }>();
  const { locus, loading, error } = useMhcLocus(locusId);

  const allele = useMemo(() => {
    if (!locus || !alleleId) return null;
    const decoded = decodeURIComponent(alleleId);
    return locus.slaAlleles.find(a => a.id === decoded || a.name === decoded);
  }, [locus, alleleId]);

  if (loading) return <Loading message="Loading allele..." />;
  if (error) return <div className="p-8 text-red-600">Error: {error.message}</div>;
  if (!locus || !allele) return <div className="p-8 text-gray-500">Allele not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/mhc" className="hover:text-purple-600">MHC</Link>
        <span className="mx-2">/</span>
        <Link to={`/mhc/${locusId}`} className="hover:text-purple-600">{locusId}</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white font-medium">{allele.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{allele.name}</h2>
        <p className="text-gray-500 mt-1">
          {allele.length} aa | {allele.tileCount} tiles | {allele.pairedCount ?? 0} paired
          {allele.meanIdentity != null && ` | Mean identity: ${(allele.meanIdentity * 100).toFixed(1)}%`}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600">{allele.length}</div>
          <div className="text-xs text-gray-500">Length (aa)</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600">{allele.tileCount}</div>
          <div className="text-xs text-gray-500">Total Tiles</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">{allele.pairedCount ?? 0}</div>
          <div className="text-xs text-gray-500">Paired to HLA</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 mb-1">Source</div>
          <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
            {allele.source}
          </span>
        </div>
      </div>

      {/* Identity visualization - horizontal bar per tile */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Tile Identity Map (SLA vs HLA)
        </h3>
        <div className="flex gap-1 flex-wrap">
          {allele.tiles.map((tile, i) => {
            const start = tile[0] as number;
            const end = tile[1] as number;
            const identity = tile[3] as number | null;
            const hlaMatch = tile[4] as string | null;
            return (
              <div
                key={i}
                className={`h-8 rounded-sm flex items-center justify-center text-[10px] text-white font-medium ${
                  identity != null ? identityColorClass(identity) : 'bg-gray-300 dark:bg-gray-600'
                }`}
                style={{ minWidth: '2rem', flex: '1 1 2rem', maxWidth: '4rem' }}
                title={`Tile ${i + 1}: ${start}-${end}${
                  identity != null ? ` | ${(identity * 100).toFixed(0)}% identity to ${hlaMatch}` : ' | No HLA pair'
                }`}
              >
                {identity != null ? `${(identity * 100).toFixed(0)}` : '—'}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500" /> &ge;85%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-500" /> 70-85%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-500" /> 50-70%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500" /> &lt;50%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-300" /> Unpaired</span>
        </div>
      </div>

      {/* Tile details table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <h3 className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
          Tile Details
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <th className="px-4 py-2 text-left font-medium text-gray-600">#</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Position</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">SLA Sequence</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Identity</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">HLA Match</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">HLA Sequence</th>
              </tr>
            </thead>
            <tbody>
              {allele.tiles.map((tile, i) => {
                const start = tile[0] as number;
                const end = tile[1] as number;
                const slaSeq = tile[2] as string;
                const identity = tile[3] as number | null;
                const hlaMatch = tile[4] as string | null;
                const hlaSeq = tile[5] as string | null;

                return (
                  <tr
                    key={i}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                  >
                    <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2 text-gray-600">{start}-{end}</td>
                    <td className="px-4 py-2">
                      <code className="text-xs font-mono break-all">
                        {slaSeq && hlaSeq
                          ? slaSeq.split('').map((aa, j) => (
                              <span
                                key={j}
                                className={
                                  j < hlaSeq.length && aa !== hlaSeq[j]
                                    ? 'text-red-600 font-bold'
                                    : 'text-gray-600'
                                }
                              >
                                {aa}
                              </span>
                            ))
                          : <span className="text-gray-600">{slaSeq}</span>}
                      </code>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {identity != null ? (
                        <span className={`font-medium ${
                          identity >= 0.85 ? 'text-green-600' :
                          identity >= 0.7 ? 'text-yellow-600' :
                          identity >= 0.5 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {(identity * 100).toFixed(1)}%
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-2 text-blue-600 text-xs">{hlaMatch || '—'}</td>
                    <td className="px-4 py-2">
                      {hlaSeq ? (
                        <code className="text-xs font-mono break-all">
                          {hlaSeq.split('').map((aa, j) => (
                            <span
                              key={j}
                              className={
                                j < slaSeq.length && aa !== slaSeq[j]
                                  ? 'text-red-600 font-bold'
                                  : 'text-gray-600'
                              }
                            >
                              {aa}
                            </span>
                          ))}
                        </code>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
