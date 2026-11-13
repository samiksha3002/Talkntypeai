// frontend/src/components/Hooks/usejudgements.js
// ─────────────────────────────────────────────────────────────────────────────
// Fix applied:
//   Import path changed to  ../../services/api  to match your project layout.
//   (App.jsx shows JudgementsPage is at src/components/ so services is at src/services/)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getDraftSession } from '../../Features/LegalHubMain/draftClient.js';
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
  const identity=getDraftSession();
  const [records,setRecords]=useState({owner:null,rows:[]}),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const [busy,setBusy]=useState(false);const generation=useRef(0);
  const saved=useMemo(()=>identity&&records.owner===identity?records.rows:[],[identity,records]);
  const invalidate=useCallback(()=>{generation.current++;},[]);
  const refresh=useCallback(async()=>{
    const ticket=++generation.current;setLoading(true);setError('');
    try{const data=await getSaved();if(!Array.isArray(data?.saved))throw Error('Invalid bookmark response.');if(ticket===generation.current&&getDraftSession()===identity)setRecords({owner:identity,rows:data.saved});return data.saved;}
    catch(e){if(ticket===generation.current){setRecords({owner:null,rows:[]});setError(e.message||'Could not load bookmarks.');}throw e;}
    finally{if(ticket===generation.current){setLoading(false);setBusy(false);}}
  },[identity]);
  useEffect(()=>{setBusy(false);refresh().catch(()=>{});return invalidate;},[refresh,invalidate]);
  const save=useCallback(async doc=>{
    const ticket=++generation.current;setBusy(true);setError('');
    try{const entry=await saveJudgement(doc);if(String(entry?.docid)!==String(doc.docid))throw Error('Bookmark save was not confirmed.');if(ticket===generation.current&&getDraftSession()===identity)setRecords(current=>({owner:identity,rows:[entry,...(current.owner===identity?current.rows:[]).filter(row=>String(row.docid)!==String(entry.docid))]}));}
    catch(e){if(ticket===generation.current){setRecords({owner:null,rows:[]});setError(e.message);}throw e;}finally{if(ticket===generation.current){setBusy(false);setLoading(false);}}
  },[identity]);
  const remove=useCallback(async docid=>{
    const ticket=++generation.current;setBusy(true);setError('');
    try{await removeSaved(docid);if(ticket===generation.current&&getDraftSession()===identity)setRecords(current=>({owner:identity,rows:current.owner===identity?current.rows.filter(row=>String(row.docid)!==String(docid)):[]}));}
    catch(e){if(ticket===generation.current){setRecords({owner:null,rows:[]});setError(e.message);}throw e;}finally{if(ticket===generation.current){setBusy(false);setLoading(false);}}
  },[identity]);
  const isSaved=useCallback(docid=>saved.some(row=>String(row.docid)===String(docid)),[saved]);
  return {saved,loading,error,busy,refresh,save,remove,isSaved};
}
