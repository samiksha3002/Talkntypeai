> Memory amendment, 14 November 2026: workspace concurrency is now 1 in Node and Python; the per-page raster allowance is 8 million pixels. Linux 512 MiB acceptance is BLOCKED because this host has no Linux/container runtime. See `legal-ai-memory-readiness.md`; prior test totals below describe the earlier candidate run.

# Chat to PDF and DraftMaster Pro — local restoration candidate

## Status and baseline

**Production release HOLD. Local implementation and synthetic end-to-end verification pass.** Nothing was pushed, deployed, committed, or written to production. No account, subscription, role, password, database, provider setting or existing customer document was changed.

User-confirmed Node/frontend baseline: `d518052`. Admin recovery was completed directly in production MongoDB without a deployment. The requested existing directory `C:\Users\hp\Talkntypeai-admin-hotfix` was inspected (clean, HEAD `117efc7`); its additional admin recovery changes were deliberately not included. Candidate worktree: `C:\Users\hp\Talkntypeai-legal-ai-restoration`, branch `hotfix/legal-ai-d518052`, directly based on `d518052`. The original `baf8d55` checkout remains untouched. Neither `8c456e7` customer changes nor later password/admin changes are bundled into this candidate.

Read-only public checks on 14 November 2026: `https://talkntype.pro/` returns 200 from Vercel and loads `/assets/index-De7WpOhZ.js`. That bundle contains both maintenance feature labels and no new `/legal-workspace/` route. Node and Python public `/health` endpoints return 200. None supplies an authoritative deployment SHA. Hosted environment settings, a newer Vercel deployment, and Python's actual deployed commit are **not independently verified**. No authenticated production request or production document flow was performed.

## A. Exact causes

Security containment commit `03d04af`, retained in `d518052`, intentionally closed both features at two layers:

* `src/Features/Components/LegalAIHub.jsx`: `activeFeature === "drafting"` renders `MaintenanceNotice` with feature `AI document drafting`, rather than `AIDrafting`. `activeFeature === "pdfChat"` similarly substitutes `PDF analysis and chat` for `ChatWithPDF`. `src/components/MaintenanceNotice.jsx` adds the words `temporarily unavailable`. These are unconditional component substitutions, not subscription failures or environment switches.
* `TNT_BRAIN/document_containment.py`: `DocumentContainment.paths` returns no-store 503 before reading bodies for `/api/analyze-document`, `/api/chat-with-pdf`, `/api/generate-legal-draft` and `/api/generate-legal-draft-stream`. `TNT_BRAIN/server.py` installs this middleware. Even JSON-only drafting is blocked because the old handler also accepts PDFs.
* The old components call Python directly without the verified Node session. Node had no authenticated proxy for these paths. `routes/legalaidraft.js` is a separate search endpoint, not the DraftMaster generation route.
* Legacy `DocumentService` has one `active_db`, deletes prior document folders, and can recover the newest `doc_*` directory without an owner check. `/api/chat-with-pdf` reads that global state. Reopening the old routes would expose customers to the wrong document. Merely restoring the components would leave the backend unavailable or unsafe.

## B. Implemented safe path and remaining release blockers

The old containment file is **unchanged**. The candidate restores the original workspaces but sends their requests to `/api/legal-workspace/:action` on Node. Existing `requireDraftAuth` resolves the session and current account subscription/admin eligibility. Login and subscription policy are unchanged. The router is mounted before global body parsing; auth and resource admission run before its JSON/multipart parsers.

Node only proxies four fixed actions to `/internal/legal-workspace/:action`, using a backend-only shared secret and the database-derived owner. Browser-supplied service/owner headers are never forwarded. Fixed upstream origin, HTTPS except loopback, no redirects, timeout, disconnect propagation and no-store streaming remain enforced. Missing service configuration fails closed. No public Python compatibility token is accepted by this new path.

Python authenticates the gateway and requires a valid owner before body parsing/admission. Every PDF uses a private temporary directory, exclusive file with mode 0600, and request-local in-memory vector retrieval. Customer PDF vectors are never written to Chroma or recovered from disk. Every chat request resubmits its selected PDF; no document ID, global active-document lookup or server document cache is used. This works across workers and restarts because each request is independent. It increases upload/embedding cost and latency relative to a future reviewed owner-scoped document store.

Limits: Node JSON 64 KiB, multipart 11 MiB; Python new-path raw body 11 MiB, PDF 10 MiB, 60 pages, 25 pages for scanned OCR, 200,000 extracted characters, 200 chunks, 8 million raster pixels per page, 300 million per document, 6 history entries, bounded facts/question/selection/output. New gateway admission: 1 concurrent request, 12 requests/minute/IP, 600 seconds; existing global controls also remain. PDF model/embedding calls use 45-second timeouts and no retries. Existing drafting provider code retains its current behavior under the outer resource deadline, with the admission slot held until underlying work settles. This is bounded admission, not hard process termination.

The browser checks session identity before accepting responses and each streamed chunk, discards stale PDF responses, clears old analysis when selecting another file, and revokes preview object URLs. Draft streams require a completion marker and surface server failure instead of accepting a truncated draft.

**Release blockers, not waived by the synthetic tests:**

1. Confirm exact deployed Python SHA and review its delta to this baseline before applying this candidate. Confirm authoritative Node/Vercel SHAs/settings; public health cannot establish them.
2. Drafting retains the existing `research_and_draft_stream` and `legal_db` legal-reference corpus. The ingestion script uses `Legal_PDFs`, separate from customer PDF uploads, but the deployed corpus's provenance/content and compatible Chroma versions were not verified. Confirm it contains only approved shared legal references and no customer-private material. Do not run ingestion, rebuild, migrate, or delete production storage as a shortcut.
3. Run real provider acceptance on an isolated service with synthetic documents and two separately authenticated test accounts, including scanned English/Hindi/Marathi PDFs, streaming failure/disconnect, maximum allowed PDFs and concurrent resource use. The local tests substitute AI outputs/embeddings and repositories; they do not establish OCR quality, real legal output, corpus retrieval quality, actual production Mongo/session behavior, or Linux dependency/startup behavior.
4. Confirm the service-to-service secret and transport are configured privately, the Python direct origin rejects missing/forged gateway headers, and external proxies preserve Authorization/SSE and enforce appropriate request/idle limits. No secrets were created or configured in hosted services here.

Thus both features have a tested local restoration candidate; an unconditional production GO would be unsupported. No unresolved shared-customer-document path was reopened. Corpus provenance remains an explicit data-isolation release gate for DraftMaster.

## C. Exact files and focused results

Production source, ten files:

* Modified `server.js`: one import and early mount of the new authenticated router.
* New `routes/legalWorkspace.js`: authenticated fixed-action gateway and budgets.
* Modified `TNT_BRAIN/server.py`: install private-path boundary and include the separate router.
* New `TNT_BRAIN/workspace_boundary.py`: backend-only authentication before bodies; new-path budgets.
* New `TNT_BRAIN/workspace_routes.py`: validated stateless upload/chat/drafting/selection routes and cleanup.
* New `TNT_BRAIN/services/request_documents.py`: request-local embeddings/vector retrieval without disk recovery.
* Modified `src/Features/Components/LegalAIHub.jsx`: replace the two notices with their feature components.
* Modified `src/Features/Components/ChatWithPDF.jsx`: secure requests, selected-PDF resubmission, stale-result protection, visible errors and preview cleanup.
* Modified `src/Features/Components/AIDrafting.jsx`: secure gateway requests, bounded history, require complete SSE; original drafting UI and output format retained.
* New `src/Features/Components/workspaceClient.js`: existing secure session, explicitly configured Node origin, no redirects/cache, response/stream session checks.

Added tests: `tests/legal-workspace.test.mjs`, `tests/legal_workspace_test.py`, `tests/legal-workspace-browser.verify.mjs`. This report is the only documentation addition.

Final verification:

* **134 Node tests PASS**, including 4 new gateway tests. Existing H1/H2/H3/H4/H5/M5/M8, containment, tenant and password suites pass.
* **22 Python tests PASS**: existing resource 10 and containment 4; new workspace 8. New tests use real generated PDFs, actual extraction and in-memory retrieval with local embeddings, two owners interleaved/concurrent, no cross-owner content, no global recovery, JSON/PDF drafting, selection command, malformed/encrypted/oversize/page/input rejection and temporary cleanup on success/failure.
* **109 Chrome scenarios PASS**: existing H1 27, H2/H3/editor/reload 30, H10 16, security/admin 6, tenant 7, M5/M8 14; new browser-to-Node-to-Python 9. New browser scenarios use separate synthetic bearer sessions and distinct ALPHA/BETA PDFs, exercise analysis/chat and typed/PDF-assisted draft streaming, and deny anonymous access. Real React components, gateway, Python handlers, PDF parsing and retrieval run; AI providers and account repositories are substituted.
* **6 existing downloaded export artifact checks PASS**.
* Isolated Vite production build **PASS**, with env files disabled and loopback synthetic API definitions; existing large-chunk warning. The output under ignored `node_modules/.cache/legal-restoration-build` is **not** a production artifact.
* JavaScript/JSX/Python syntax and Git whitespace checks pass. No repository-wide lint claim.

The eight fixes remain present and their focused regressions pass. Auth routes, admin middleware/UI, password verification, models, subscriptions, existing legacy containment and old shared DocumentService are unchanged from `d518052`. No dependency, lockfile, hosting configuration, environment file, database or template migration is included.

## D. Minimum deployment plan — future, approval required

Do not deploy until the four release blockers above are closed and approval is given.

1. Record the actual deployed service SHAs/configuration and current rollback artifacts. Prepare a narrowly reviewed patch of only the ten production files above on the verified deployed baseline, retaining any newer deployed changes. In particular, do not deploy the unrelated extra admin-hotfix branch changes or reset working Admin recovery. No account or data migration is required.
2. Privately provision one random backend-only secret of at least 32 characters as `LEGAL_AI_SERVICE_KEY` on **both Node and Python**. Set Node `LEGAL_AI_SERVICE_URL` to the confirmed HTTPS Python origin, with no path/query. Preserve all current Mongo, provider, account, disk and resource settings. Keep `VITE_DRAFT_API_URL` pointing to the correct HTTPS Node origin; never expose the service key through a VITE variable.
3. Deploy the reviewed **Python** candidate first using the existing dependency installation and `cd TNT_BRAIN && uvicorn server:app --host 0.0.0.0 --port "$PORT"`. Verify health, private-path missing/forged-key denial and continued 503 on all four old PDF routes. Preserve the legal-reference corpus/storage; no ingestion or cleanup commands.
4. Deploy the reviewed **Node** candidate using existing `npm ci` and current start/OCR settings. Verify anonymous/expired/ineligible requests are denied and two isolated synthetic accounts can use the private Python path. Confirm working Admin login/authorization and existing customer workflows. No database changes.
5. Build/deploy the matching **frontend** with existing Vite/Vercel settings after Node/Python acceptance. Run the two-user PDF and typed/PDF drafting smoke flows; check stale upload/session changes, provider failure and streamed completion. Old cached clients continue to receive legacy maintenance 503, without any insecure fallback.
6. On failure, restore the previously reviewed contained frontend and disable/remove the **new** Node gateway mount or its service configuration. Keep all legacy containment and auth fixes; do not revert wholesale to pre-security code. Retain account/session/document data and approved legal corpus. Python's old endpoints remain blocked throughout.
