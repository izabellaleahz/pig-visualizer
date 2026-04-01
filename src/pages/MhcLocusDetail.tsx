import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMhcLocus } from '../hooks/useData';
import Loading from '../components/Loading';

function idColor(id: number | null | undefined): string {
  if (id == null) return 'text-gray-400';
  const pct = id * 100;
  if (pct >= 70) return 'text-green-600';
  if (pct >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function idBg(id: number | null | undefined): string {
  if (id == null) return 'bg-gray-300';
  const pct = id * 100;
  if (pct >= 70) return 'bg-green-500';
  if (pct >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function MhcLocusDetail() {
  const { locusId } = useParams<{ locusId: string }>();
  const { locus, loading, error } = useMhcLocus(locusId);
  const [tab, setTab] = useState<'sla' | 'hla'>('sla');
  const [search, setSearch] = useState('');
  const [expandedAllele, setExpandedAllele] = useState<string | null>(null);

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
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/mhc" className="hover:text-purple-600">MHC</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 dark:text-white font-medium">{locus.id}</span>
        {locus.ortholog && (
          <span className="text-blue-600 ml-2">&harr; {locus.ortholog}</span>
        )}
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-purple-600">{locus.id}</span>
          {locus.ortholog && (
            <>
              <span className="text-gray-400 text-xl">&harr;</span>
              <span className="text-2xl font-bold text-blue-600">{locus.ortholog}</span>
            </>
          )}
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          locus.class === 'I'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
            : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
        }`}>Class {locus.class}</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
          <div className="text-2xl font-bold text-purple-600">{locus.alleleCount}</div>
          <div className="text-xs text-purple-500">SLA alleles</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600">{locus.hlaAlleleCount}</div>
          <div className="text-xs text-blue-500">HLA alleles</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
          <div className="text-2xl font-bold text-purple-600">{locus.tileCount.toLocaleString()}</div>
          <div className="text-xs text-purple-500">SLA tiles</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600">{locus.hlaTileCount.toLocaleString()}</div>
          <div className="text-xs text-blue-500">HLA tiles</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className={`text-2xl font-bold ${idColor(locus.meanIdentity)}`}>
            {locus.meanIdentity != null ? `${(locus.meanIdentity * 100).toFixed(1)}%` : 'N/A'}
          </div>
          <div className="text-xs text-gray-500">Mean identity</div>
        </div>
      </div>

      {/* Tabs + search */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setTab('sla')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === 'sla'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          SLA Alleles ({locus.alleleCount})
        </button>
        <button
          onClick={() => setTab('hla')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
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
          className="ml-auto px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 w-48"
        />
      </div>

      {/* SLA tab */}
      {tab === 'sla' && (
        <div className="space-y-2">
          {filteredSla.map(allele => {
            const isExpanded = expandedAllele === allele.id;
            return (
              <div key={allele.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Allele header row */}
                <button
                  onClick={() => setExpandedAllele(isExpanded ? null : allele.id)}
                  className="w-full px-4 py-3 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left"
                >
                  <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-medium text-purple-700 dark:text-purple-400 w-40 shrink-0">{allele.name}</span>
                  <span className="text-xs text-gray-500 w-16">{allele.length} aa</span>
                  <span className="text-xs text-gray-500 w-20">{allele.tileCount} tiles</span>
                  <span className={`text-xs font-medium w-20 ${idColor(allele.meanIdentity)}`}>
                    {allele.meanIdentity != null ? `${(allele.meanIdentity * 100).toFixed(1)}% id` : 'unpaired'}
                  </span>
                  {/* Mini identity bar */}
                  <div className="flex gap-px flex-1 max-w-xs">
                    {allele.tiles.map((t, i) => (
                      <div
                        key={i}
                        className={`h-3 flex-1 rounded-sm ${idBg(t[3] as number | null)}`}
                        title={`pos ${t[0]}: ${t[3] != null ? `${((t[3] as number) * 100).toFixed(0)}%` : 'unpaired'}`}
                      />
                    ))}
                  </div>
                </button>

                {/* Expanded: tile-by-tile alignment */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-900">
                    <div className="text-xs text-gray-500 mb-2">
                      Tile-by-tile SLA vs HLA comparison ({allele.tileCount} tiles, each 49aa)
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {allele.tiles.map((tile, i) => {
                        const start = tile[0] as number;
                        const end = tile[1] as number;
                        const slaSeq = tile[2] as string;
                        const identity = tile[3] as number | null;
                        const hlaMatch = tile[4] as string | null;
                        const hlaSeq = tile[5] as string | null;

                        return (
                          <div key={i} className="bg-white dark:bg-gray-800 rounded p-3 text-xs">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-500">Tile {i + 1} ({start}-{end})</span>
                              {identity != null ? (
                                <span className={`font-bold ${idColor(identity)}`}>
                                  {(identity * 100).toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-gray-400">No HLA pair</span>
                              )}
                              {hlaMatch && (
                                <span className="text-blue-500 text-[10px]">{hlaMatch}</span>
                              )}
                            </div>
                            {/* Alignment */}
                            <div className="font-mono text-[11px] space-y-0.5 overflow-x-auto">
                              <div className="flex gap-2">
                                <span className="text-purple-600 w-12 shrink-0 text-right">SLA</span>
                                <span>{slaSeq && hlaSeq ? slaSeq.split('').map((aa, j) => (
                                  <span key={j} className={j < hlaSeq.length && aa !== hlaSeq[j] ? 'text-red-600 font-bold' : 'text-gray-500'}>{aa}</span>
                                )) : <span className="text-gray-500">{slaSeq}</span>}</span>
                              </div>
                              {hlaSeq && (
                                <div className="flex gap-2">
                                  <span className="text-blue-600 w-12 shrink-0 text-right">HLA</span>
                                  <span>{hlaSeq.split('').map((aa, j) => (
                                    <span key={j} className={j < slaSeq.length && aa !== slaSeq[j] ? 'text-red-600 font-bold' : 'text-gray-500'}>{aa}</span>
                                  ))}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* HLA tab */}
      {tab === 'hla' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <th className="px-4 py-2 text-left font-medium text-gray-600">Allele</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Global Freq</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Rank</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Length</th>
                <th className="px-4 py-2 text-right font-medium text-gray-600">Tiles</th>
                <th className="px-4 py-2 text-left font-medium text-gray-600">UniProt</th>
              </tr>
            </thead>
            <tbody>
              {filteredHla.map(allele => (
                <tr key={allele.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-4 py-2.5 font-medium text-blue-600">{allele.name}</td>
                  <td className="px-4 py-2.5 text-right">
                    {allele.frequency != null ? (
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(allele.frequency * 100 * 3, 100)}%` }} />
                        </div>
                        <span className="text-xs w-12 text-right">{(allele.frequency * 100).toFixed(2)}%</span>
                      </div>
                    ) : ''}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-500">#{allele.rank ?? ''}</td>
                  <td className="px-4 py-2.5 text-right text-gray-600">{allele.length} aa</td>
                  <td className="px-4 py-2.5 text-right">{allele.tileCount}</td>
                  <td className="px-4 py-2.5">
                    {allele.uniprot ? (
                      <a href={`https://www.uniprot.org/uniprot/${allele.uniprot}`} target="_blank" rel="noopener noreferrer"
                        className="text-blue-500 hover:underline text-xs">{allele.uniprot}</a>
                    ) : ''}
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
