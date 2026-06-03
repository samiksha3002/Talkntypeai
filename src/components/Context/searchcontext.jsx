// frontend/src/context/SearchContext.jsx
//
// Global state so SearchBar, JudgementList, and JudgementDetail
// all stay in sync without prop-drilling.
//

import React, { createContext, useContext, useState, useCallback } from 'react';

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  // ── Search state ───────────────────────────────────────────────────────────
  const [queryText,      setQueryText]      = useState('');
  const [activeFilters,  setActiveFilters]  = useState(['all-courts', 'landmark']);
  const [activeModule,   setActiveModule]   = useState('latest-cases');
  const [activeSideIcon, setActiveSideIcon] = useState('latest');

  // ── Results state ──────────────────────────────────────────────────────────
  const [results,        setResults]        = useState([]);
  const [isLoading,      setIsLoading]      = useState(false);
  const [error,          setError]          = useState(null);
  const [totalResults,   setTotalResults]   = useState(0);
  const [currentPage,    setCurrentPage]    = useState(0);

  // ── Selected judgement ─────────────────────────────────────────────────────
  const [selectedDocid,  setSelectedDocid]  = useState(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
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