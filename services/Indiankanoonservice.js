// services/indianKanoonService.js
//
// Indian Kanoon REST API reference:
//   POST https://api.indiankanoon.org/search/        → full-text search
//   GET  https://api.indiankanoon.org/doc/{docid}/   → single document
//
// Auth: Bearer token in Authorization header
// Docs: https://api.indiankanoon.org (after registering)

import axios  from "axios";
import config from "../config.js";

const client = axios.create({
  baseURL: config.indianKanoon.baseUrl,
  headers: {
    Authorization:  `Token ${config.indianKanoon.token}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  timeout: 15000,
});

// ─────────────────────────────────────────────────────────────────────────────
// searchJudgements
//   formtext   : free-text query string
//   pagenum    : 0-indexed page number (20 results per page)
//   filters    : optional object { court, fromdate, todate, ... }
// Returns raw Indian Kanoon response
// ─────────────────────────────────────────────────────────────────────────────
async function searchJudgements({ formtext = "", pagenum = 0, filters = {} }) {
  // Indian Kanoon uses application/x-www-form-urlencoded POST body
  const params = new URLSearchParams();
  params.append("formtext", formtext);
  params.append("pagenum",  String(pagenum));

  // Optional filters
  if (filters.fromdate) params.append("fromdate", filters.fromdate); // DD-MM-YYYY
  if (filters.todate)   params.append("todate",   filters.todate);
  if (filters.court)    params.append("court",    filters.court);
  if (filters.author)   params.append("author",   filters.author);  // judge name
  if (filters.bench)    params.append("bench",    filters.bench);

  const response = await client.post("/search/", params.toString());
  return response.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// getDocument
//   docid  : numeric ID from search results (doc.tid)
// Returns full judgement text + meta
// ─────────────────────────────────────────────────────────────────────────────
async function getDocument(docid) {
  const response = await client.get(`/doc/${docid}/`);
  return response.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// getDocumentFragment  (for highlighted excerpts)
//   docid     : document ID
//   query     : the search query to highlight terms
// ─────────────────────────────────────────────────────────────────────────────
async function getDocumentFragment(docid, query) {
  const params = new URLSearchParams();
  params.append("formtext", query);
  const response = await client.post(`/docfragment/${docid}/`, params.toString());
  return response.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// normaliseDoc
//   Converts raw IK doc format → clean shape used by our frontend
// ─────────────────────────────────────────────────────────────────────────────
function normaliseDoc(ikDoc) {
  return {
    id:       ikDoc.tid,
    title:    ikDoc.title,
    citation: ikDoc.citation    || "",
    court:    ikDoc.docsource   || "",
    date:     ikDoc.publishdate || "",
    url:      `https://indiankanoon.org/doc/${ikDoc.tid}/`,
    snippet:  ikDoc.headline    || "",          // short excerpt
    doctype:  ikDoc.doctype     || "judgment",  // judgment | act | article
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// normaliseSearchResult
//   Converts raw IK search response → { results[], total, pagenum }
// ─────────────────────────────────────────────────────────────────────────────
function normaliseSearchResult(ikResponse) {
  const docs = (ikResponse.docs || []).map(normaliseDoc);
  return {
    results: docs,
    total:   ikResponse.found   || 0,
    pagenum: ikResponse.pagenum || 0,
    pages:   Math.ceil((ikResponse.found || 0) / 20),
  };
}

export default {
  searchJudgements,
  getDocument,
  getDocumentFragment,
  normaliseDoc,
  normaliseSearchResult,
};