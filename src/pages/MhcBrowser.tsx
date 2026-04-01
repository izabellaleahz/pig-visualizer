import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMhcSummary } from '../hooks/useData';
import Loading from '../components/Loading';

export default function MhcBrowser() {
  const { loci, loading, error } = useMhcSummary();
  const [showMinor, setShowMinor] = useState(false);

  if (loading) return <Loading message="Loading MHC data..." />;
  if (error) return <div className="p-8 text-red-600">Error: {error.message}</div>;

  // Split into paired (have HLA ortholog) and unpaired (minor loci)
  const paired = loci.filter(l => l.ortholog);
  const unpaired = loci.filter(l => !l.ortholog);
  const classI = paired.filter(l => l.class === 'I');
  const classII = paired.filter(l => l.class === 'II');

  const totalSla = loci.reduce((s, l) => s + l.tileCount, 0);
  const totalHla = loci.reduce((s, l) => s + l.hlaTileCount, 0);
  // const totalPaired = loci.reduce((s, l) => s + l.pairedTiles, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          MHC: SLA / HLA Comparison
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Pig SLA alleles (from IPD-MHC, all alleles) paired with human HLA alleles
          (top 100 by frequency, UniProt + IMGT/HLA). Click a locus to explore alleles and tile alignments.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard label="SLA Alleles" value={loci.reduce((s, l) => s + l.alleleCount, 0)} sub={`${paired.length} paired loci`} color="text-purple-600" />
        <StatCard label="SLA Tiles" value={totalSla} sub="49aa peptides" color="text-purple-600" />
        <StatCard label="HLA Alleles" value={loci.reduce((s, l) => s + l.hlaAlleleCount, 0)} sub="top 100 by frequency" color="text-blue-600" />
        <StatCard label="HLA Tiles" value={totalHla} sub="paired counterparts" color="text-blue-600" />
      </div>

      {/* Class I */}
      {classI.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">Class I</span>
            Antigen Presentation to CD8+ T cells
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {classI.map(l => <LocusCard key={l.id} locus={l} />)}
          </div>
        </div>
      )}

      {/* Class II */}
      {classII.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded-full">Class II</span>
            Antigen Presentation to CD4+ T cells
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {classII.map(l => <LocusCard key={l.id} locus={l} />)}
          </div>
        </div>
      )}

      {/* Minor / unpaired loci */}
      {unpaired.length > 0 && (
        <div className="mb-8">
          <button
            onClick={() => setShowMinor(!showMinor)}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
          >
            <svg className={`w-4 h-4 transition-transform ${showMinor ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {unpaired.length} minor loci without HLA ortholog (SLA-6, SLA-7, SLA-8, TAP, MIC, etc.)
          </button>
          {showMinor && (
            <div className="grid md:grid-cols-4 gap-3 mt-3">
              {unpaired.map(l => (
                <Link
                  key={l.id}
                  to={`/mhc/${l.id}`}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:border-gray-400 transition-colors"
                >
                  <div className="font-medium text-gray-700 dark:text-gray-300 text-sm">{l.id}</div>
                  <div className="text-xs text-gray-500 mt-1">{l.alleleCount} alleles, {l.tileCount} tiles</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ortholog map */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">About this comparison</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          SLA (Swine Leukocyte Antigen) and HLA (Human Leukocyte Antigen) are orthologous MHC systems.
          Each SLA tile is matched to the most similar HLA tile from the orthologous locus
          (e.g., SLA-1 tiles are compared to HLA-A tiles). MHC proteins are the primary drivers of
          transplant rejection. SLA alleles from IPD-MHC (all known, no frequency cutoff).
          HLA alleles filtered to the 100 most common globally (CWD alleles by pypop frequency data).
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</div>
      <div className="text-sm text-gray-700 dark:text-gray-300">{label}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
    </div>
  );
}

function LocusCard({ locus }: { locus: { id: string; name: string; ortholog: string | null; class: string; alleleCount: number; tileCount: number; pairedTiles: number; meanIdentity: number | null; hlaAlleleCount: number; hlaTileCount: number } }) {
  const idPct = locus.meanIdentity != null ? (locus.meanIdentity * 100) : null;

  return (
    <Link
      to={`/mhc/${locus.id}`}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-600 transition-all"
    >
      {/* Header: SLA ↔ HLA */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{locus.id}</span>
          <span className="text-gray-400">&harr;</span>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{locus.ortholog}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div className="text-purple-600 dark:text-purple-400">
          <span className="font-medium">{locus.alleleCount}</span>
          <span className="text-xs text-gray-500 ml-1">SLA alleles</span>
        </div>
        <div className="text-blue-600 dark:text-blue-400">
          <span className="font-medium">{locus.hlaAlleleCount}</span>
          <span className="text-xs text-gray-500 ml-1">HLA alleles</span>
        </div>
        <div className="text-purple-600 dark:text-purple-400">
          <span className="font-medium">{locus.tileCount.toLocaleString()}</span>
          <span className="text-xs text-gray-500 ml-1">SLA tiles</span>
        </div>
        <div className="text-blue-600 dark:text-blue-400">
          <span className="font-medium">{locus.hlaTileCount.toLocaleString()}</span>
          <span className="text-xs text-gray-500 ml-1">HLA tiles</span>
        </div>
      </div>

      {/* Identity bar */}
      {idPct != null && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">Mean SLA-HLA identity</span>
            <span className={`font-medium ${
              idPct >= 70 ? 'text-green-600' : idPct >= 40 ? 'text-yellow-600' : 'text-red-600'
            }`}>{idPct.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                idPct >= 70 ? 'bg-green-500' : idPct >= 40 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(idPct, 100)}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}
