// frontend/src/services/api.js
// ─────────────────────────────────────────────────────────────────────────────
// Fix applied:
//   BASE_URL default changed to match your server.js port (5000)
//   and your existing VITE_API_URL env var pattern.
// ─────────────────────────────────────────────────────────────────────────────

import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||    // set this in frontend .env
  import.meta.env.VITE_API_URL      ||    // fallback to your existing var
  'http://localhost:5000/api';

const api = axios.create({
  baseURL : BASE_URL,
  timeout : 20000,
  headers : { 'Content-Type': 'application/json' },
});

// Request interceptor — attach auth token if you add auth later
api.interceptors.request.use((config) => config);

// Response interceptor — unwrap data, normalise errors
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.error ||
      err.message              ||
      'Unknown error';
    return Promise.reject(new Error(message));
  }
);

// ── Judgements ────────────────────────────────────────────────────────────────

export const searchJudgements    = (query, page = 0, filters = {}) =>
  api.get('/judgements/search', { params: { q: query, page, ...filters } });

export const getLatestJudgements = () =>
  api.get('/judgements/latest');

export const getJudgement        = (docid) =>
  api.get(`/judgements/${docid}`);

export const getJudgementFragment = (docid, query) =>
  api.get(`/judgements/${docid}/fragment`, { params: { q: query } });

// ── Saved ─────────────────────────────────────────────────────────────────────

export const getSaved      = ()     => api.get('/saved');
export const saveJudgement = (data) => api.post('/saved', data);
export const removeSaved   = (docid) => api.delete(`/saved/${docid}`);

export default api;