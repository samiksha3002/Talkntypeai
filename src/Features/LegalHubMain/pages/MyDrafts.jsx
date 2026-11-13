import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DraftSignIn from '../DraftSignIn.jsx';
import { draftRequest } from '../draftClient.js';
export default function MyDrafts() {
  const [drafts, setDrafts] = useState([]);
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true); setError('');
    draftRequest('/user-drafts?page=' + page, { signal: controller.signal }).then(result => {
      if (!Array.isArray(result.data) || result.data.some(d => !/^[a-f0-9]{24}$/i.test(d._id) || typeof d.title !== 'string') || typeof result.hasMore !== 'boolean') throw new Error('Invalid draft list response.');
      if (active) { setDrafts(result.data); setMore(result.hasMore); }
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [page, retry]);
  return <main className="mx-auto max-w-4xl p-8">
    <h1 className="text-3xl font-bold mb-6">My Drafts</h1>
    <nav className="flex gap-4 mb-6"><Link to="/draft-studio">Draft Studio</Link><Link to="/dashboard">Dashboard</Link><Link to="/login">Sign in again</Link></nav>
    {loading ? <p role="status">Loading drafts...</p> : error ? <div role="alert"><p>{error}</p><DraftSignIn onSuccess={() => setRetry(n => n + 1)} /><button onClick={() => setRetry(n => n + 1)}>Retry</button></div> : <>
      {drafts.length === 0 ? <p>No saved drafts.</p> : <ul>{drafts.map(d => <li className="border-b py-4" key={d._id}><Link className="text-violet-700 underline" to={'/draft/edit/' + d._id}>{d.title}</Link><p>{d.category} ? Revision {d.revision}</p></li>)}</ul>}
      <div className="flex gap-4 mt-6"><button disabled={!page} onClick={() => setPage(p => p - 1)}>Previous</button><button disabled={!more} onClick={() => setPage(p => p + 1)}>Next</button></div>
    </>}
  </main>;
}
