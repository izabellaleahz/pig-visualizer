import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import { useSearchIndex } from '../hooks/useData';

interface SearchResult {
  type: 'species' | 'protein';
  id: string;
  name: string;
  species?: string;
}

export default function Search() {
  const { searchIndex } = useSearchIndex();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Build search index
  const fuse = useMemo(() => {
    if (!searchIndex) return null;

    const items: SearchResult[] = [
      ...searchIndex.species.map(s => ({
        type: 'species' as const,
        id: s.id,
        name: s.name,
      })),
      ...searchIndex.proteins.map(p => ({
        type: 'protein' as const,
        id: p.id,
        name: p.name,
        species: p.species,
      })),
    ];

    return new Fuse(items, {
      keys: ['name', 'id'],
      threshold: 0.3,
      includeScore: true,
    });
  }, [searchIndex]);

  // Search results
  const results = useMemo(() => {
    if (!fuse || !query.trim()) return [];
    return fuse.search(query).slice(0, 8).map(r => r.item);
  }, [fuse, query]);

  // Handle navigation
  const handleSelect = (result: SearchResult) => {
    if (result.type === 'species') {
      navigate(`/species/${result.id}`);
    } else {
      navigate(`/protein/${result.id}`);
    }
    setQuery('');
    setIsOpen(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        onKeyDown={handleKeyDown}
        placeholder="Search proteins..."
        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
      />

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result)}
              className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors ${
                index === selectedIndex
                  ? 'bg-pink-50 dark:bg-pink-900/30'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span
                className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  result.type === 'species'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                }`}
              >
                {result.type === 'species' ? 'Species' : 'Protein'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {result.name}
                </div>
                {result.species && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {result.species === 'pig' ? 'Pig' : 'Human'}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
