import { useState, useEffect } from 'react';
import type { Species, Protein, ProteinSummary, SearchIndex, LibraryStatistics, SpeciesId } from '../types';
import * as api from '../utils/api';

export function useSpecies() {
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    api.fetchSpecies()
      .then(setSpecies)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { species, loading, error };
}

// Returns protein summaries (without tiles) for listing views
export function useSpeciesProteins(speciesId: SpeciesId | undefined) {
  const [proteins, setProteins] = useState<ProteinSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!speciesId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setProgress(0);

    api.fetchSpeciesProteins(speciesId, (loaded, total) => {
      if (total > 0) {
        setProgress(Math.round((loaded / total) * 100));
      }
    })
      .then(setProteins)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [speciesId]);

  return { proteins, loading, error, progress };
}

export function useSearchIndex() {
  const [searchIndex, setSearchIndex] = useState<SearchIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    api.fetchSearchIndex()
      .then(setSearchIndex)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { searchIndex, loading, error };
}

export function useStatistics() {
  const [statistics, setStatistics] = useState<LibraryStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    api.fetchStatistics()
      .then(setStatistics)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { statistics, loading, error };
}

export function useProtein(proteinId: string | undefined) {
  const [protein, setProtein] = useState<Protein | null>(null);
  const [speciesId, setSpeciesId] = useState<SpeciesId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!proteinId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    api.findProteinById(proteinId)
      .then(result => {
        if (result) {
          setProtein(result.protein);
          setSpeciesId(result.speciesId);
        }
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [proteinId]);

  return { protein, speciesId, loading, error };
}
