import React, { useState } from 'react';
import { draftRequest, storeDraftSession, SESSION_STORAGE_MESSAGE } from './draftClient.js';
export default function DraftSignIn({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const result = await draftRequest('/draft-session', { method: 'POST', publicRequest: true, body: { email, password } });
      if (!/^[a-f0-9]{64}$/.test(result.data?.token || '')) throw new Error('Session was not confirmed.');
      if (!storeDraftSession(result.data)) throw new Error(SESSION_STORAGE_MESSAGE);
      setPassword(''); onSuccess();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <form onSubmit={submit} className="border rounded p-4 my-4 max-w-md">
    <h2 className="font-bold">Sign in for secure draft access</h2>
    <p>Your document stays open while you renew your session.</p>
    <label className="block">Email<input className="block border p-2 w-full" type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} /></label>
    <label className="block">Password<input className="block border p-2 w-full" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} /></label>
    {error && <p role="alert">{error}</p>}
    <button className="border p-2 mt-2" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
  </form>;
}
