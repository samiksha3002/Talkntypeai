// frontend/src/services/api.js
//
// Single Axios instance for all backend calls.
// Components never call fetch/axios directly — always use this module.
//

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://talkntypeai.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor (add auth token if needed later) ──────────────────────
api.interceptors.request.use((config) => config);

// ── Response interceptor — normalise errors ───────────────────────────────────
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.error ||
      err.message ||
      'Unknown error';
    return Promise.reject(new Error(message));
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Judgements API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Search judgements
 * @param {string} query
 * @param {number} page
 * @param {Object} filters  { court, from, to, author }
 */
export const searchJudgements = (query, page = 0, filters = {}) =>
  api.get('/judgements/search', {
    params: { q: query, page, ...filters },
  });

/**
 * Fetch latest / recent judgements
 */
export const getLatestJudgements = () => api.get('/judgements/latest');

/**
 * Get a single judgement by its Indian Kanoon doc ID
 * @param {string|number} docid
 */
export const getJudgement = (docid) => api.get(`/judgements/${docid}`);

/**
 * Get highlighted fragment for a document
 * @param {string|number} docid
 * @param {string} query
 */
export const getJudgementFragment = (docid, query) =>
  api.get(`/judgements/${docid}/fragment`, { params: { q: query } });

// ─────────────────────────────────────────────────────────────────────────────
// Saved Judgements API
// ─────────────────────────────────────────────────────────────────────────────

export const getSaved       = () => api.get('/saved');
export const saveJudgement  = (data) => api.post('/saved', data);
export const removeSaved    = (docid) => api.delete(`/saved/${docid}`);