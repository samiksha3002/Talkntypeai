// frontend/src/components/Context/searchcontext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Path matches App.jsx import:
//   import { SearchProvider } from './components/Context/searchcontext.jsx'
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useCallback } from 'react';

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const [queryText,      setQueryText]      = useState('');
  const [activeFilters,  setActiveFilters]  = useState(['all-courts', 'landmark']);
  const [activeModule,   setActiveModule]   = useState('latest-cases');
  const [activeSideIcon, setActiveSideIcon] = useState('latest');

  const [results,        setResults]        = useState([]);
  const [isLoading,      setIsLoading]      = useState(false);
  const [error,          setError]          = useState(null);
  const [totalResults,   setTotalResults]   = useState(0);
  const [currentPage,    setCurrentPage]    = useState(0);

  const [selectedDocid,  setSelectedDocid]  = useState(null);

  const toggleFilter = useCallback((id) => {
    setActiveFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }, []);

  const value = {
    queryText,      setQueryText,
    activeFilters,  toggleFilter,
    activeModule,   setActiveModule,
    activeSideIcon, setActiveSideIcon,
    results,        setResults,
    isLoading,      setIsLoading,
    error,          setError,
    totalResults,   setTotalResults,
    currentPage,    setCurrentPage,
    selectedDocid,  setSelectedDocid,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearchContext must be inside <SearchProvider>');
  return ctx;
}