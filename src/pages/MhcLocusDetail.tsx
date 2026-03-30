import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMhcLocus } from '../hooks/useData';
import Loading from '../components/Loading';

function identityColor(id: number | null | undefined): string {
  if (id == null) return 'text-gray-400';
  if (id >= 0.85) return 'text-green-600';
  if (id >= 0.7) return 'text-yellow-600';
  if (id >= 0.5) return 'text-orange-600';
  return 'text-red-600';
}

function identityBg(id: number | null | undefined): string {
  if (id == null) return 'bg-gray-200';
  if (id >= 0.85) return 'bg-green-500';
  if (id >= 0.7) return 'bg-yellow-500';
  if (id >= 0.5) return 'bg-orange-500';
  return 'bg-red-500';
}

export default function MhcLocusDetail() {
  const { locusId } = useParams<{ locusId: string }>();
  const { locus, loading, error } = useMhcLocus(locusId);
  const [tab, setTab] = useState<'sla' | 'hla'>('sla');
  const [search, setSearch] = useState('');

  const filteredSla = useMemo(() => {
    if (!locus) return [];
    const q = search.toLowerCase();
    return locus.slaAlleles.filter(a => a.name.toLowerCase().includes(q));
  }, [locus, search]);

  const filteredHla = useMemo(() => {
    if (!locus) return [];
    const q = search.toLowerCase();
    return locus.hlaAlleles.filter(a => a.name.toLowerCase().includes(q));
  }, [locus, search]);

  if (loading) return <Loading message={`Loading ${locusId}...`} />;
  if (error) return <div className="p-8 text-red-600">Error: {error.message}</div>;
  if (!locus) return <div className="p-8 text-gray-500">Locus not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/mhc" className="hover:text-purple-600">MHC</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white font-medium">{locus.id}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {locus.id}
          <span className="ml-2 text-lg font-normal text-gray-500">
            (Class {locus.class})
          </span>
        </h2>
        {locus.ortholog && (
          <p className="text-blue-600 mt-1">
            HLA Ortholog: {locus.ortholog}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600">{locus.alleleCount}</div>
          <div className="text-xs text-gray-500">SLA Alleles</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600">{locus.hlaAlleleCount}</div>
          <div className="text-xs text-gray-500">HLA Alleles</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600">{locus.tileCount.toLocaleString()}</div>
          <div className="text-xs text-gray-500">SLA Tiles</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">{locus.pairedTiles.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Paired Tiles</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className={`text-2xl font-bold ${identityColor(locus.meanIdentity)}`}>
            {locus.meanIdentity != null ? `${(locus.meanIdentity * 100).toFixed(1)}%` : '—'}
          </div>
          <div className="text-xs text-gray-500">Mean Identity</div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTab('sla')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'sla'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          SLA Alleles ({locus.alleleCount})
        </button>
        <button
          onClick={() => setTab('hla')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'hla'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          HLA Alleles ({locus.hlaAlleleCount})
        </button>
        <input
          type="text"
          placeholder="Filter alleles..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ml-auto px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800"
        />
      </div>

      {/* SLA allele list */}
      {tab === 'sla' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <th className="px-4 py-2 text-left font-medium text-gray-600">Allele</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Length</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Tiles</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Paired</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Mean Identity</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Identity Map</th>
              </tr>
            </thead>
            <tbody>
              {filteredSla.map(allele => (
                <tr
                  key={allele.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/mhc/${locusId}/${encodeURIComponent(allele.id)}`}
                      className="text-purple-600 hover:text-purple-800 font-medium"
                    >
                      {allele.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{allele.length} aa</td>
                  <td className="px-4 py-3 text-right">{allele.tileCount}</td>
                  <td className="px-4 py-3 text-right">{allele.pairedCount ?? 0}</td>
                  <td className={`px-4 py-3 text-right font-medium ${identityColor(allele.meanIdentity)}`}>
                    {allele.meanIdentity != null ? `${(allele.meanIdentity * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {/* Mini identity bar */}
                    <div className="flex gap-0.5">
                      {allele.tiles.map((t, i) => {
                        const identity = t[3] as number | null;
                        return (
                          <div
                            key={i}
                            className={`w-2 h-4 rounded-sm ${identityBg(identity)}`}
                            title={`pos ${t[0]}: ${identity != null ? `${(identity * 100).toFixed(0)}%` : 'unpaired'}`}
                          />
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* HLA allele list */}
      {tab === 'hla' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <th className="px-4 py-2 text-left font-medium text-gray-600">Allele</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Frequency</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Rank</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Length</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Tiles</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">Source</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">UniProt</th>
              </tr>
            </thead>
            <tbody>
              {filteredHla.map(allele => (
                <tr
                  key={allele.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                >
                  <td className="px-4 py-3 font-medium text-blue-600">{allele.name}</td>
                  <td className="px-4 py-3 text-right">
                    {allele.frequency != null ? `${(allele.frequency * 100).toFixed(2)}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">#{allele.rank ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{allele.length} aa</td>
                  <td className="px-4 py-3 text-right">{allele.tileCount}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {allele.source}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {allele.uniprot ? (
                      <a
                        href={`https://www.uniprot.org/uniprot/${allele.uniprot}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline text-xs"
                      >
                        {allele.uniprot}
                      </a>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
