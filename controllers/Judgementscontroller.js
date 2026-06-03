// controllers/judgementsController.js
//
// All request handlers for judgement-related routes.
// Each function: validate inputs → call IK service → normalise → respond.
//

import ikService from "../services/indianKanoonService.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/judgements/search?q=...&page=0&court=...&from=...&to=...
// ─────────────────────────────────────────────────────────────────────────────
async function search(req, res) {
  try {
    const {
      q      = "",
      page   = "0",
      court  = "",
      from   = "",
      to     = "",
      author = "",   // judge name
    } = req.query;

    if (!q.trim()) {
      return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }

    const raw  = await ikService.searchJudgements({
      formtext: q,
      pagenum:  parseInt(page, 10) || 0,
      filters:  { court, fromdate: from, todate: to, author },
    });

    const data = ikService.normaliseSearchResult(raw);
    return res.json(data);
  } catch (err) {
    console.error("[search] Error:", err.message);
    return res.status(502).json({ error: "Failed to fetch from Indian Kanoon." });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/judgements/:docid
// ─────────────────────────────────────────────────────────────────────────────
async function getById(req, res) {
  try {
    const { docid } = req.params;
    if (!docid || isNaN(Number(docid))) {
      return res.status(400).json({ error: "Invalid document ID." });
    }

    const raw = await ikService.getDocument(docid);
    const doc = ikService.normaliseDoc(raw);

    // Include full judgment text (HTML from IK)
    doc.fulltext = raw.doc || "";

    return res.json(doc);
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: "Document not found." });
    }
    console.error("[getById] Error:", err.message);
    return res.status(502).json({ error: "Failed to fetch document." });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/judgements/:docid/fragment?q=...
//   Returns highlighted excerpts for a document + query combination
// ─────────────────────────────────────────────────────────────────────────────
async function getFragment(req, res) {
  try {
    const { docid } = req.params;
    const { q = "" } = req.query;

    const raw = await ikService.getDocumentFragment(docid, q);
    return res.json({ fragment: raw.fragment || raw });
  } catch (err) {
    console.error("[getFragment] Error:", err.message);
    return res.status(502).json({ error: "Failed to fetch fragment." });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/judgements/latest
//   Returns recent landmark judgements (SC + HCs)
//   We search for broad recent terms as IK has no dedicated "latest" endpoint
// ─────────────────────────────────────────────────────────────────────────────
async function getLatest(req, res) {
  try {
    // Broad query to get recent results; sort by date (IK default is relevance)
    const raw  = await ikService.searchJudgements({
      formtext: "judgment",
      pagenum:  0,
      filters:  {},
    });
    const data = ikService.normaliseSearchResult(raw);
    return res.json(data);
  } catch (err) {
    console.error("[getLatest] Error:", err.message);
    return res.status(502).json({ error: "Failed to fetch latest judgements." });
  }
}

export default { search, getById, getFragment, getLatest };