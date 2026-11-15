import { bookmarkRequest } from './bookmarks.js';
import axios from 'axios';

import { getNodeApi } from '../../nodeApi.js';

const api = axios.create({
  timeout : 20000,
  headers : { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async config => { config.baseURL = await getNodeApi(); return config; });

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