// frontend/src/components/Hooks/usejudgements.js
// ─────────────────────────────────────────────────────────────────────────────
// Fix applied:
//   Import path changed to  ../../services/api  to match your project layout.
//   (App.jsx shows JudgementsPage is at src/components/ so services is at src/services/)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import {
  searchJudgements,
  getLatestJudgements,
  getJudgement,
  getSaved,
  saveJudgement,
  removeSaved,
} from '../services/api';


// ──────────────────────────────────────────────────────────────────────────
// useLatestJudgements  — loads on mount
// ─────────────────────────────────────────────────────────────────────────────
export function useLatestJudgements() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getLatestJudgements()
      .then((d)  => { if (!cancelled) { setData(d);          setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });

    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// useSearch  — call search(query, page, filters) to trigger
// ─────────────────────────────────────────────────────────────────────────────
export function useSearch() {
  const [results,  setResults]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [query,    setQuery]    = useState('');
  const [page,     setPage]     = useState(0);
  const [filters,  setFilters]  = useState({});

  const search = useCallback(async (q, p = 0, f = {}) => {
    if (!q?.trim()) return;
    setQuery(q);
    setPage(p);
    setFilters(f);
    setLoading(true);
    setError(null);

    try {
      const data = await searchJudgements(q, p, f);
      setResults(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const nextPage = useCallback(
    () => search(query, page + 1, filters),
    [query, page, filters, search]
  );
  const prevPage = useCallback(
    () => search(query, Math.max(0, page - 1), filters),
    [query, page, filters, search]
  );

  return { results, loading, error, query, page, search, nextPage, prevPage };
}

// ─────────────────────────────────────────────────────────────────────────────
// useJudgement  — fetches a single document by docid
// ─────────────────────────────────────────────────────────────────────────────
export function useJudgement(docid) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!docid) return;
    let cancelled = false;

    setLoading(true);
    setData(null);
    setError(null);

    getJudgement(docid)
      .then((d)  => { if (!cancelled) { setData(d);          setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });

    return () => { cancelled = true; };
  }, [docid]);

  return { data, loading, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// useSaved  — bookmark management
// ─────────────────────────────────────────────────────────────────────────────
export function useSaved() {
  const [saved,   setSaved]   = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    getSaved()
      .then((d) => { setSaved(d?.saved || []); setLoading(false); })
      .catch(()  => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback(async (doc) => {
    await saveJudgement(doc);
    refresh();
  }, [refresh]);

  const remove = useCallback(async (docid) => {
    await removeSaved(docid);
    refresh();
  }, [refresh]);

  const isSaved = useCallback(
    (docid) => saved.some((s) => String(s.docid) === String(docid)),
    [saved]
  );

  return { saved, loading, save, remove, isSaved };
}