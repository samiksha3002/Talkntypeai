# H1 implementation and release notes

This branch adds template-based personal drafts without modifying master templates or existing account records. No production data or external services were accessed during implementation.

## Configuration

- Set frontend build variable VITE_DRAFT_API_URL explicitly to the intended Express backend origin or its /api base. HTTPS is required except localhost loopback. No production fallback exists for draft operations. Do not use the Python service.
- The existing backend MONGODB_URI (or existing MONGO_URI fallback) remains in use at runtime. Never load production environment files into local tests.
- No session signing secret is needed: each session uses a random 256-bit bearer token; only its SHA-256 digest is stored in DraftSession. Sessions expire after 12 hours and are checked against the database and account status on every protected request.
- The bearer token is kept in sessionStorage, never in URLs. It avoids cross-site cookie dependence between the frontend and Render. XSS can steal bearer tokens; HTTPS and the application's broader XSS remediation remain important. Do not log Authorization headers.
- Existing CORS origins must include the intended staging frontend. No CORS or hosting rewrites were changed.
- If sessionStorage access is denied, legacy database-backed login and logout continue. Draft-session utilities catch storage get/set/remove failures, refuse stale-token use in that runtime, and show a storage-unavailable message on protected draft operations. No fallback to browser user IDs or roles authorizes drafts. Re-enable storage and sign in again for draft access. Logout revocation remains best effort when storage/network access is unavailable; server expiry is still enforced.

## API and storage

Existing GET /api/drafts/all and GET /api/drafts/:id remain template-only and unchanged.
POST /api/draft-session verifies a real Mongo user and returns a session. It has a dedicated attempt limiter. It deliberately has no static administrator bypass. Existing account records/password representations are not migrated. Existing plaintext password handling is pre-existing technical debt, not fixed by H1.
Database-verified normal /api/login responses additionally include draftSession. Session-storage failures leave legacy login available, with draft access denied until successful draft sign-in. When VITE_DRAFT_API_URL is set, Login uses that same backend.

Authenticated /api/user-drafts supports POST /, GET /, GET /:id and PATCH /:id. POST /logout revokes the current session. There is no delete endpoint. Owner IDs are derived from verified sessions; client ownership fields are rejected. List responses are paginated and omit document bodies. New documents require a real template ID.

UserDraft stores ownerId, templateId, title, category, canonical HTML, timestamps, revision, creation key/hash, and last update operation/hash. A deterministic owner/creation-key document ID and a unique owner/creation-key index prevent duplicate creates even if automatic secondary indexes are disabled; initialization is awaited before creation. Updates use an atomic owner/ID/revision predicate. Stale changes receive 409. Retries replay the same pending operation before sending newer text. New collection/index creation is normal application initialization; no migration script is supplied or executed. Verify runtime database permissions and index creation in isolated staging.

## Frontend behavior

/draft/create?templateId=... starts from an explicit Mongo template; legacy navigation-state draftId is treated only as a template ID. /drafts lists personal drafts. /draft/edit/:id reopens saved HTML directly, without Markdown conversion or template slicing.

Load failures remain visible with Retry; no bundled-template substitution occurs. Saves require confirmed document identity/revision and stay on the editor. Typing during a save remains unsaved and is clearly indicated. Sign-in can be renewed within the error panel without leaving the document. Copy unsaved text is available on save errors.

Back/Cancel/My Drafts controls ask before leaving dirty content; full reload/close uses beforeunload. Same-tab SPA recovery retains unsaved HTML and pending save identity in memory, isolated by session and route. Recovery is cleared on login/logout; it is not persistent offline storage and does not survive full browser restart. If a stale-update conflict occurs, copy your edits before reopening/merging the latest version. No automatic merge occurs.

HTML is canonicalized on the server with an explicit tag/style allowlist, and DOMPurify sanitizes browser rendering. Supported content includes paragraphs/headings, inline emphasis, lists, tables/cell spans, alignment, fonts/sizes, colors and bounded spacing. Scripts, images, URLs, event handlers and arbitrary CSS are excluded. Validate real legal-document fixtures before release; unsupported formatting is deliberately removed.

## Corrected verification defects

1. Quoted font names were escaped to HTML entities and then rejected on reopening. CSS quote entities are now decoded before applying a restricted font-list grammar. Output escapes double quotes for the surrounding HTML attribute; single quotes are retained safely. Repeated sanitization is stable for supported single/double quoted fonts. CSS URLs, expressions, event handlers, unsupported declarations, and encoded delimiter attacks remain rejected. Browser rendering still uses DOMPurify; sanitization was not disabled.
2. A sessionStorage exception could abort legacy login before its error handler. Storage utilities now return failure safely, provide safe render-time reads, and fail closed for authenticated draft requests. Login retains normal user/admin redirects; failed draft-session persistence is reported without blocking the unrelated login. The in-page draft sign-in only reports success after token storage is verified. Logout also tolerates storage exceptions.
3. The earlier tests contained question marks instead of Hindi/Marathi. Fixtures now use reliable Devanagari Unicode escapes. An independent code-point oracle checks exact Hindi and Marathi strings, create/read preserves exact HTML/text, and a deliberately corrupted copy must fail the text assertions.

## Local verification ? November 13, 2026

From the repository root:

- node --test tests/h1-drafts.test.mjs ? **27 PASS, 0 FAIL**. Repository/fetch mocks only; no server.js, dotenv files, Mongo connection, HTTP listener, or external provider is used by this suite.
- node tests/h1-browser.verify.mjs ? **27 PASS, 0 FAIL**. Requires the existing Windows Chrome installation and installed project dependencies. This reproducible harness binds only loopback, uses actual H1 React components and Express routers with synthetic accounts/in-memory repositories, and launches an isolated temporary Chrome profile with external requests routed to a dead loopback proxy. It does not import server.js, load dotenv, connect MongoDB, or use production. A nonzero exit indicates failed/incomplete verification.
- Focused installed-tool ESLint check: **0 errors, 0 warnings** across 22 H1 JavaScript/JSX/test files (no-undef and React hook checks). Syntax parsing passed for the same files. Nine changed JSX components transformed successfully in memory.
- Production-mode Vite build: **PASS**, with environment-file loading disabled, synthetic loopback draft API configuration, and output in a new temporary directory. No deployment occurred. Existing large-chunk warning remains (~2.4 MB main JavaScript chunk).
- Git diff whitespace check: **PASS**. Existing H1 work remains uncommitted; no push occurred.

Browser checks include both formerly failing cases, quoted fonts after repeated saves/reopens and full reload, actual Hindi/Marathi, create/read/update, typing during save, failed-request text retention, expiry and in-page renewal, two-user HTTP isolation, missing authentication, normal login, database-admin redirect, legacy login when session persistence fails, and normal/storage-denied logout, including separate getItem, setItem and removeItem exception scenarios. They do not exercise the entire unrelated dashboard/editor or administrator management interface.

## Readiness and remaining verification

**Local fixes verified; production release remains NO-GO pending isolated staging and real MongoDB verification.** No further failures were found in the executed focused checks. Repository-wide ESLint was rerun and still fails loading eslint.config.js:13 (the existing hooks-plugin configuration mismatch). No repository source linting occurs through that command. This pre-existing issue was not changed by this patch; the successful focused lint above uses an in-memory configuration.

No explicitly isolated staging environment, synthetic staging accounts, or isolated MongoDB instance was configured. Not executed: real collection/index creation, duplicate-key races and atomic revision behavior under real Mongo, session TTL cleanup, backend restart persistence, hosted cross-origin/proxy/deep-link behavior, cross-browser/mobile checks, native unload-dialog behavior, or full unrelated dashboard/admin integrations. Browser/mock checks do not substitute for those checks.

VITE_DRAFT_API_URL still must be explicitly configured for the intended Express backend at build time. No environment files, credentials, account records, passwords, or production data were modified. No dependencies were installed, migrations run, or external services called.

## Release sequence and risks

1. Review the H1-only diff and back up using the existing production operating procedure before any future authorized release.
2. Verify the new collections/indexes, two real test users, expiry/revocation and atomic updates in isolated staging. Verify editor paste/formatting, typing during save, retry/reauth, browser back/reload, list pagination and direct-link reload.
3. Deploy compatible backend first, then build frontend with the explicit intended VITE_DRAFT_API_URL. Both services must address the same user database. Existing browser-only identities require real sign-in.
4. Monitor sanitized status/count metrics, not document bodies, passwords or bearer tokens. Check cross-origin preflight and index permissions.

Rollback: revert this branch's code changes using the normal release process and restore the previous frontend/backend artifacts. Do not drop UserDraft or DraftSession collections, overwrite master templates, run seed scripts, or alter account records. The old frontend cannot open newly saved personal drafts; retain a compatible read path or temporarily keep the new backend available for recovery. No production changes have been performed by this task.

## Exact changed files

Modified: routes/auth.js; server.js; src/App.jsx; src/Features/LegalHubMain/pages/DraftCreate.jsx; src/Features/LegalHubMain/pages/DraftStudio.jsx; src/components/Login.jsx; src/components/DashboardNavbar.jsx; src/components/AdminPanel.jsx; src/components/AdminDashboard.jsx.

Created: models/UserDraft.js; models/DraftSession.js; middleware/draftAuth.js; routes/userDrafts.js; routes/draftSession.js; utils/draftHtml.js; src/Features/LegalHubMain/draftClient.js; src/Features/LegalHubMain/draftLogout.js; src/Features/LegalHubMain/draftRecovery.js; src/Features/LegalHubMain/DraftSignIn.jsx; src/Features/LegalHubMain/pages/MyDrafts.jsx; tests/h1-drafts.test.mjs; tests/h1-browser.verify.mjs; docs/H1-drafts.md.

## Scope of verification-failure correction

Only these files changed during this correction: utils/draftHtml.js; src/Features/LegalHubMain/draftClient.js; src/Features/LegalHubMain/draftLogout.js; src/Features/LegalHubMain/DraftSignIn.jsx; src/Features/LegalHubMain/pages/DraftCreate.jsx; src/components/Login.jsx; tests/h1-drafts.test.mjs; docs/H1-drafts.md; and new tests/h1-browser.verify.mjs. All earlier uncommitted H1 work was retained.
