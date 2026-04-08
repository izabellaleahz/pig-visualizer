import { useState, useEffect } from 'react';
import Loading from '../components/Loading';

interface PeptideControl {
  id: string;
  gene: string;
  type: string;
  description: string;
  sequence: string;
  length_aa: number;
  oligo_length_bp: number;
}

interface StopCodonPhages {
  count: number;
  type: string;
  description: string;
  stop_codons: string[];
  oligo_length_bp: number;
  filler_length_bp: number;
}

interface ControlsData {
  peptide_controls: PeptideControl[];
  stop_codon_phages: StopCodonPhages;
  total: number;
  oligo_geometry: {
    adapter_5prime: string;
    adapter_3prime: string;
    coding_length_bp: number;
    total_oligo_bp: number;
  };
}

const BASE_URL = (import.meta.env.BASE_URL || '/') + 'data';

export default function Controls() {
  const [data, setData] = useState<ControlsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/controls.json`)
      .then(r => r.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Loading message="Loading controls..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error ? `Error: ${error.message}` : 'Controls data not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Library Controls</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {data.total} control oligos for validation and normalization
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Controls" value={data.total} color="text-teal-600" />
        <StatCard label="Peptide Controls" value={data.peptide_controls.length} color="text-teal-600" />
        <StatCard label="Stop Codon Phages" value={data.stop_codon_phages.count} color="text-teal-500" />
        <StatCard label="Oligo Length" value={`${data.oligo_geometry.total_oligo_bp} bp`} color="text-gray-700 dark:text-gray-300" />
      </div>

      {/* Peptide Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Peptide Controls
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Known human protein fragments for positive control validation. Codon-optimized for E. coli K12.
        </p>

        <div className="space-y-4">
          {data.peptide_controls.map(ctrl => (
            <div key={ctrl.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300">
                  {ctrl.gene}
                </span>
                <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                  {ctrl.id}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {ctrl.description}
              </p>
              <div className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all bg-white dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700">
                {ctrl.sequence}
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {ctrl.length_aa} aa peptide &rarr; {ctrl.oligo_length_bp} bp oligo
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stop Codon Phages */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Stop Codon Phages
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Empty phage display negative controls. Each has an in-frame stop codon at position 1, followed by random filler DNA.
          No peptide is displayed &mdash; used for background signal normalization.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="text-2xl font-bold text-teal-600">{data.stop_codon_phages.count}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total phages</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.stop_codon_phages.oligo_length_bp} bp</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Oligo length each</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Design</h3>
          <div className="space-y-1.5 text-sm">
            <Row label="Stop codons" value={data.stop_codon_phages.stop_codons.join(', ') + ' (rotating)'} />
            <Row label="Filler length" value={`${data.stop_codon_phages.filler_length_bp} bp random DNA`} />
            <Row label="IDs" value={`CONTROL_STOP_001 through CONTROL_STOP_0${data.stop_codon_phages.count}`} />
            <Row label="QC checks" value="GC 30-70%, no RE sites, no homopolymers >= 7bp" />
          </div>
        </div>
      </div>

      {/* Oligo Geometry */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Oligo Geometry</h2>
        <div className="space-y-2 text-sm">
          <Row label="Total oligo" value={`${data.oligo_geometry.total_oligo_bp} bp`} />
          <Row label="5' adapter" value={data.oligo_geometry.adapter_5prime} mono />
          <Row label="Coding region" value={`${data.oligo_geometry.coding_length_bp} bp`} />
          <Row label="3' adapter" value={data.oligo_geometry.adapter_3prime} mono />
        </div>
        <div className="mt-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
          <div className="font-mono text-xs text-center text-gray-600 dark:text-gray-400">
            <span className="text-blue-500">5' adapter (24bp)</span>
            {' + '}
            <span className="text-teal-600 font-bold">coding (147bp)</span>
            {' + '}
            <span className="text-blue-500">3' adapter (24bp)</span>
            {' = '}
            <span className="font-bold text-gray-900 dark:text-white">195bp</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className={`text-2xl font-bold ${color}`}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-medium text-gray-900 dark:text-white ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
