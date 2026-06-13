// services/indianKanoonService.js
// ─────────────────────────────────────────────────────────────────────────────
// All Indian Kanoon API calls live here.
// Controller imports this — token never leaves the backend.
// ─────────────────────────────────────────────────────────────────────────────

import axios   from "axios";
import config  from "../config.js";

// ── Axios instance ─────────────────────────────────────────────────────────
const IK = axios.create({
  baseURL : config.indianKanoon.baseUrl,
  timeout : 30000,   // 30s — IK can be slow
  headers : {
    Authorization  : `Token ${config.indianKanoon.token}`,
    Accept         : "application/json",
    "Content-Type" : "application/x-www-form-urlencoded",
  },
});

// Log every request + response for debugging
IK.interceptors.request.use((req) => {
  console.log(`[IK REQ] ${req.method?.toUpperCase()} ${req.baseURL}${req.url}`);
  console.log(`[IK REQ] Token: ${config.indianKanoon.token?.slice(0,8)}...`);
  return req;
});

IK.interceptors.response.use(
  (res) => {
    console.log(`[IK RES] ${res.status} — keys: ${Object.keys(res.data || {}).join(', ')}`);
    return res;
  },
  (err) => {
    console.error(`[IK ERR] ${err.code} | status: ${err.response?.status} | msg: ${err.message}`);
    console.error(`[IK ERR] URL was: ${err.config?.url}`);
    throw err;
  }
);

// ── Court name → IK doctype code ──────────────────────────────────────────
const COURT_CODES = {
  "Supreme Court of India"       : "supremecourt",
  "Delhi High Court"             : "delhi",
  "Bombay High Court"            : "bombay",
  "Madras High Court"            : "chennai",
  "Calcutta High Court"          : "kolkata",
  "Allahabad High Court"         : "allahabad",
  "Karnataka High Court"         : "karnataka",
  "Gujarat High Court"           : "gujarat",
  "Punjab & Haryana High Court"  : "punjab",
  "Rajasthan High Court"         : "rajasthan",
  "Kerala High Court"            : "kerala",
  "Patna High Court"             : "patna",
  "Orissa High Court"            : "orissa",
  "Gauhati High Court"           : "gauhati",
  "Himachal Pradesh High Court"  : "himachal_pradesh",
  "Uttarakhand High Court"       : "uttaranchal",
  "Jharkhand High Court"         : "jharkhand",
  "Chhattisgarh High Court"      : "chattisgarh",
  "Madhya Pradesh High Court"    : "madhyapradesh",
  "Jammu & Kashmir High Court"   : "jammu",
  "Andhra Pradesh High Court"    : "andhra",
  "Sikkim High Court"            : "sikkim",
  "Meghalaya High Court"         : "meghalaya",
  "Tripura High Court"           : "tripura",
  "Manipur High Court"           : "manipur",
};

// ─────────────────────────────────────────────────────────────────────────────
// searchJudgements({ formtext, pagenum, filters })
//   filters: { court, fromdate, todate, author }
//
// GET /search/?formInput=<query>&pagenum=<n>
// ─────────────────────────────────────────────────────────────────────────────
async function searchJudgements({ formtext = "", pagenum = 0, filters = {} }) {
  let query = formtext.trim();

  // ── Smart query building ──────────────────────────────────────────────────
  const isCaseName = /\bv\.?\s|\bvs\.?\s|\bversus\b/i.test(query);
  const isCitation = /\b(AIR|SCC|SCR|\d{4}\s+SCC|\d{4}\s+AIR)/i.test(query);

  let formattedQuery = query;

  if (isCaseName && !query.startsWith('"')) {
    // Remove year in brackets e.g. "(1973)"
    const cleanName = query.replace(/\s*\(\d{4}\)\s*/g, "").trim();
    // Use title: operator for better exact case matching
    formattedQuery = `title:"${cleanName}"`;
  } else if (isCitation) {
    formattedQuery = `"${query}"`;
  }

  let parts = [formattedQuery].filter(Boolean);

  // Court filter
  const courtCode = COURT_CODES[filters.court];
  if (courtCode) parts.push(`doctype:${courtCode}`);

  // Year filter
  if (filters.year) {
    parts.push(`fromdate:01-01-${filters.year}`);
    parts.push(`todate:31-12-${filters.year}`);
  }

  // Date range
  if (filters.fromdate) parts.push(`fromdate:${filters.fromdate}`);
  if (filters.todate)   parts.push(`todate:${filters.todate}`);

  // Author
  if (filters.author) parts.push(`author:${filters.author}`);

  // Fallback
  if (parts.length === 0) parts.push("doctypes:judgments");

  const formInput = parts.join(" ");
  console.log("[IK] search →", formInput, "page:", pagenum);

  // IK search = POST with query params in URL (not body)
  const { data } = await IK.post(
    `/search/?formInput=${encodeURIComponent(formInput)}&pagenum=${pagenum}`
  );

  return data; // raw IK response — controller calls normaliseSearchResult()
}

// ─────────────────────────────────────────────────────────────────────────────
// getDocument(docid)  — POST /doc/<docid>/
// Full judgement HTML + metadata
// ─────────────────────────────────────────────────────────────────────────────
async function getDocument(docid) {
  console.log("[IK] getDocument →", docid);
  const { data } = await IK.post(`/doc/${docid}/`);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// getDocumentFragment(docid, query)  — POST /docfragment/<docid>/?formInput=<q>
// Highlighted excerpt — cheapest call (Rs 0.05)
// ─────────────────────────────────────────────────────────────────────────────
async function getDocumentFragment(docid, query = "") {
  console.log("[IK] getFragment →", docid, query);
  const { data } = await IK.post(`/docfragment/${docid}/`, null, {
    params: { formInput: query },
  });
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// normaliseSearchResult(raw)
// Converts IK's raw search response to our clean shape
// ─────────────────────────────────────────────────────────────────────────────
function normaliseSearchResult(raw) {
  const docs  = raw?.docs  || [];
  const found = raw?.found || 0;

  return {
    total   : found,
    results : docs.map(normaliseDoc),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// normaliseDoc(doc)
// Single document → our shape
// Used by both search results and full document fetch
// ─────────────────────────────────────────────────────────────────────────────
function normaliseDoc(doc) {
  return {
    id       : doc.tid,
    title    : doc.title     || "Untitled Judgement",
    citation : extractCitation(doc.title || ""),
    court    : doc.docsource || "Unknown Court",
    date     : doc.publishdate || "",
    subject  : doc.categories?.[0] || "General",
    snippet  : doc.headline  || "",
    bench    : doc.author    || "",
    // Full text — only present when fetched via getDocument()
    fulltext : doc.doc       || "",
    // Related data
    acts     : doc.citedsections || [],
    cites    : doc.cites     || [],
    citedby  : doc.citedby   || [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function extractCitation(title = "") {
  const air = title.match(/AIR\s+\d{4}\s+\w+\s+\d+/i);
  const scc = title.match(/\(\d{4}\)\s+\d+\s+SCC\s+\d+/i);
  if (air) return air[0];
  if (scc) return scc[0];
  return "";
}

const ikService = {
  searchJudgements,
  getDocument,
  getDocumentFragment,
  normaliseSearchResult,
  normaliseDoc,
  COURT_CODES,
};

export default ikService;