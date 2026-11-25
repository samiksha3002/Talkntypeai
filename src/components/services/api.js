import { bookmarkRequest } from './bookmarks.js';
import axios from 'axios';
import { attachAxiosAuth } from '../../apiAuth.js';

// Auto-detect: production ya local
// Koi env var ki zaroorat nahi — window.location se pata chalta hai
const isProduction = typeof window !== 'undefined' 
  && !window.location.hostname.includes('localhost');

const BASE_URL = isProduction
  ? 'https://talkntypeai.onrender.com/api'
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL : BASE_URL,
  timeout : 20000,
  headers : { 'Content-Type': 'application/json' },
});
attachAxiosAuth(api);

api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(new Error(
    err.response?.data?.error || err.message || 'Unknown error'
  ))
);

export const searchJudgements     = (query, page = 0, filters = {}) =>
  api.get('/judgements/search', { params: { q: query, page, ...filters } });
export const getLatestJudgements  = () => api.get('/judgements/latest');
export const getJudgement         = (docid) => api.get(`/judgements/${docid}`);
export const getJudgementFragment = (docid, query) =>
  api.get(`/judgements/${docid}/fragment`, { params: { q: query } });
export const getSaved      = ()      => bookmarkRequest();
export const saveJudgement = (data)  => bookmarkRequest('', { method:'POST', body:data });
export const removeSaved   = (docid) => bookmarkRequest('/'+encodeURIComponent(docid), { method:'DELETE' });

export default api;