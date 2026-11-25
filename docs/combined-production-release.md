# Combined eight-fix production candidate

Decision: **NO-GO for production**. Local integration and regression verification pass. Security containment, isolated Mongo acceptance and hosted compatibility gates remain open. This document is the current combined runbook; imported implementation notes describe historical runs and are not release approval.

## Provenance and exact scope

- Fetched `origin/main` during preparation; it is `bbd21041af1a97283c933fd9974f4a1f00f39cf9`, matching the user-confirmed production branch.
- New branch: `release/all-eight-production-rc`; worktree: `C:/Users/hp/Talkntypeai-all-eight-production-rc`. Its parent is exactly `bbd2104`.
- Applied an explicitly selected diff from `47d04c3` to completed checkpoint `baf8d55`. Excluded all H2/H3 source/tests and the historical H2/H3 note/status inventory. `git apply --check` and application succeeded: **zero conflicts**.
- Integrated 65 files belonging to H1/H4/H5/H10/M5/M8, all matching `baf8d55` exactly after line-ending normalization. This report is the only additional file. No fix was reimplemented or security implementation redesigned.
- All deployed H2/H3 files, including the autosave font correction and expanded reload tests, remain identical to `bbd2104`. The existing H2/H3 release report is retained as historical scope documentation.
- Production package manifests/lockfile, `src/Editor/editor.api.js`, database connection configuration, Vercel configuration and Render blueprint remain unchanged. `routes/audio.js` receives only the completed H5 patch on top of the production audio implementation.
- Original branches/checkpoints `baf8d55`, `e15c6a0`, `bbd2104` and all earlier worktrees are preserved. No push, deployment, migration, account modification, production connection or installation was performed. Only the requested Git fetch and public hosting documentation were accessed remotely.

## Executed verification

| Check | Result |
|---|---|
| All existing Node regression suites, including autosave correction | 114 PASS, 0 FAIL |
| Existing H5 Python suite, existing root virtual environment | 10 PASS, 0 FAIL |
| Actual local Chrome scenarios | 87 PASS, 0 FAIL |
| Downloaded PDF/DOCX artifact checks | 6 PASS, 0 FAIL |
| Existing regression total | **217 PASS, 0 FAIL** |
| Additional real offline English OCR to searchable PDF smoke | PASS |
| Production-mode Vite build, synthetic loopback settings | PASS |
| Focused lint, 70 JS/JSX/MJS files | 0 errors; 3 existing hook warnings |
| Syntax transforms, 70 files; Python AST, 9 files | PASS |
| Git whitespace and checkpoint/source provenance checks | PASS |

Chrome breakdown: H1 27, H2/H3/editor/persistence 30, H10 16, M5 7, M8 7. Tests include login/logout, storage failures, draft create/save/reopen/reauthentication, two-user isolation, bookmark mutation/reload/failure, judgement sanitization/print, speech/caret behavior, legacy-font actual reloads and long multipage exports. Mongo repositories and provider responses are synthetic. The test browser uses temporary profiles and blocks external requests. No real client documents or existing client browser profiles were read.

The extra OCR smoke used the repository's existing `eng.traineddata` (5,199,098 bytes), installed local Tesseract/WASM/native canvas, a generated English image, and PDF text extraction. `OCR_LANG_PATH` was explicitly the local repository root and `OCR_UNCOMPRESSED=1`; model loading was confirmed to use local filesystem paths. It recognized two words and produced searchable text. An extraction warning about standard-font configuration did not prevent the assertion. This proves one local Windows OCR path, not Linux deployment, rotated real-scan acceptance or unsupported-language support.

Build environment-file loading was disabled (`envFile:false`), inherited secrets scrubbed and API definitions set to loopback. Main chunk is about 2.02 MB; deferred PDF/Word chunks remain large. This synthetic artifact must NOT be deployed. Logs/build are ignored under `node_modules/.cache/all-eight-release/`; dependencies are reused through an ignored junction. No fresh dependency installation or deployment-OS build was performed.

Standalone credential/provider diagnostic scripts such as `test-ik.mjs` and `verify-token.mjs` were not executed; they are not isolated regression suites and can contact external services. Full server/provider startup and native viewer/Word acceptance were also not executed.

Standard repository lint was executed and exits 2 at the known `eslint.config.js` hooks-plugin configuration error. No repository-wide lint success is claimed. Focused warnings: two existing JudgementsPage dependency warnings and one Stenocard dependency warning.

## Database and authentication acceptance

No Mongo connection was made. Do not start `server.js` or seed scripts locally with production environment files. Runtime selects `MONGODB_URI`, then `MONGO_URI`, then localhost fallback; dotenv reads `.env` and `.env.local`. Neither a default localhost URL nor an arbitrary database name proves isolation.

H1 adds `DraftSession` and `UserDraft`; M5 adds `SavedJudgement`. Owner IDs come from verified bearer sessions, not request ownership fields. Tokens are random, stored in sessionStorage, hashed in Mongo, valid for 12 hours, and checked against current account/subscription status on each protected request. Expired sessions are rejected without relying on TTL cleanup. Draft revisions use owner/ID/revision atomic predicates; create and bookmark identities are deterministic. Normal database-backed login adds a draft session; session persistence failure leaves legacy login available but protected drafts/bookmarks fail closed. Static administrator bypass identities cannot obtain protected sessions. Never add a fallback accepting browser user IDs or roles.

Required before release: a positively isolated Mongo target and synthetic users, with no production credentials. Verify actual model collection names and permissions; unique tokenHash and expiresAt TTL indexes for DraftSession; unique ownerId/creationKey plus ownerId/updatedAt indexes for UserDraft; unique ownerId/docid plus ownerId/savedAt/_id indexes for SavedJudgement. Test real collection/index initialization, concurrent duplicate requests, revision conflicts, write failures, two-owner read/list/update/delete isolation, inactive/expired/deleted accounts, logout/expiry, API restart persistence and Mongo restart retention. Confirm deployed account password representation is compatible with both existing login and draft-session verification. These tests were NOT executed against real Mongo.

New model initialization can create collections/indexes during normal startup even without an explicit migration command. This is a production write dependency requiring an approved backup, privileges and acceptance evidence. No schema migration or index command was run here. Do not run seed scripts, reassign bookmarks or alter existing passwords to make acceptance pass.

Legacy bookmarks were an unowned in-memory Map; there is no safe automatic ownership migration. Old clients receive 401 from the authenticated replacement until the matching frontend and real sign-in are used. Coordinate maintenance/communication; do not serve the new frontend against the old shared backend or weaken auth for old clients. Browser-only identities, static-admin login and expired subscriptions do not authorize drafts/bookmarks. Password hashing remediation must update both login paths compatibly; it is not a silent database-only change.

## Minimum security containment before enabling the release

| Finding | Remaining exposure | Minimum effective containment |
|---|---|---|
| C1 | Public admin routes lack verified administrator authorization | Deny public access to `/api/admin/*`; require a trusted authenticated administrative boundary until server enforcement exists. |
| C2 | Existing plaintext password storage and unrestricted user records | Block unrestricted user-record responses; restrict exposed account data to trusted operators. A compatible hashing/recovery plan remains required; containment does not make stored passwords secure. |
| C3 | Static-admin bypass and long-lived credential in browser source | Disable/block the bypass server-side and revoke/rotate exposed credentials through separately authorized work; stop distributing the credential or withhold the affected feature until authenticated short-lived access is ready. VITE variables do not hide secrets. |
| C4 | Legacy case/client/payment/report/team/inquiry/CSV routes lack enforced owner scope | Disable or restrict affected endpoints at a boundary that also covers direct Render access until authenticated ownership is enforced. H1/M5 fix their own paths only. |
| C5 | Shared Python active PDF database lacks tenant isolation | Disable public PDF analysis/upload/chat/generation, or restrict it to a single trusted isolated operator, until authenticated tenant-scoped state exists. Locks and H5 budgets do not isolate users. |

No containment was executed or verified in this run. UI hiding, CORS, rate limiting and a private frontend alone cannot protect a publicly accessible backend. Preserve protected draft/bookmark middleware. If effective containment requires interrupting a feature, plan that interruption explicitly for existing clients; do not silently disable a protection. C1-C5 are still blockers for a fully enabled combined release.

## Hosting configuration and environment requirements

| Service | Required settings |
|---|---|
| Vercel frontend | Repository root; Vite; install `npm ci`, build `npm run build`, output `dist`. Production-scoped `VITE_DRAFT_API_URL` must be the correct HTTPS **Node** origin (origin or `/api` accepted). Set `VITE_API_URL` to the intended Node origin; `/config.json` `API_URL` overrides the editor's initial origin. Preserve/verify existing `VITE_TNT_AI_API_URL` for its AI route. Never put server credentials in VITE variables. |
| Render Node | Repository root; build `npm ci`; start `npm start`; `NODE_ENV=production`; listen on Render `PORT`. Explicit `MONGODB_URI` (or intentional `MONGO_URI` fallback); `OPENAI_API_KEY`, `DEEPGRAM_API_KEY`, uppercase `GEMINI_API_KEY`, `INDIAN_KANOON_API_TOKEN` and existing provider/base/cache settings where those features are enabled. Match Node/runtime/native dependencies to the tested lockfile and validate on Linux. |
| Searchable OCR on Node | `OCR_LANG_PATH` must be an absolute directory containing `eng.traineddata.gz`, or existing `eng.traineddata` with `OCR_UNCOMPRESSED=1`. With service root at repository root, the documented start command below points at the tracked model; no model download is required. Validate checksum/licensing and Linux initialization before release. |
| Render Python | Repository root; build `pip install -r TNT_BRAIN/requirements.txt`; start from `TNT_BRAIN` using uvicorn and Render `PORT`. `OPENAI_API_KEY`, `TAVILY_API_KEY`; `INDIAN_KANOON_API_KEY` where research requires it. `DOCUMENT_DB_DIR`, `DOCUMENT_DB_TTL_SECONDS`, `OCR_MAX_PAGES` are existing document-service settings. Python uses local `users.json` separately from Node accounts; it is not H1 authentication. Preserve any existing account-file storage; do not invent shared identity. |

No hosted environment values were inspected. Python requirements are mostly unpinned; a clean Linux dependency resolution, native binaries and runtime startup remain unverified. No new signing secret is required for H1's random bearer sessions. Case-sensitive `GEMINI_API_KEY` must not be mistaken for differently capitalized legacy environment names.

Hosting blockers: `render.yaml` uses nonexistent-on-Linux `TNT-brain` instead of tracked `TNT_BRAIN`, defines only Python and has no Node service. Do not use the blueprint unchanged. Configure the existing services explicitly or approve a targeted hosting correction later; no infrastructure is created here. `vercel.json` rewrites `/api` to `talkntype.onrender.com` while several frontend clients hardcode `talkntypeai.onrender.com`; Python clients also use a hardcoded origin. Confirm all actual origins/aliases, direct calls and configured draft/login backend are intentional and compatible. Environment changes alone do not override every hardcoded client. Exact deployed Node/Python revisions and service configuration remain unknown.

Node resource knobs (positive integers) and existing defaults: DOCUMENT_UPLOAD_MB=100, SEARCHABLE_UPLOAD_MB=25, AUDIO_UPLOAD_MB=10, API_BODY_MB=100, BODY_CONCURRENCY=4, BODY_TIMEOUT_MS=120000, DOCUMENT_MAX_PAGES=500, DOCUMENT_MAX_IMAGE_PIXELS=40000000, DOCUMENT_MAX_RASTER_PIXELS=2000000000, DOCUMENT_TIMEOUT_MS=600000, DOCUMENT_CONCURRENCY=2, CSV_MAX_ROWS=50000, AI_CONCURRENCY=8, AI_TIMEOUT_MS=180000, AI_REQUESTS_PER_MINUTE=60. Shared document rate is 30/minute/IP. Python: BRAIN_BODY_MB=100, BRAIN_CONCURRENCY=2, BRAIN_TIMEOUT_SECONDS=600, BRAIN_REQUESTS_PER_MINUTE=30; DOCUMENT_UPLOAD_MB and DOCUMENT_MAX_PAGES also apply. Python body includes multipart overhead: set its total cap above the desired file cap if allowing full 100 MiB files. Review limits against synthetic client-sized documents and host memory/CPU; align proxy caps/timeouts. NAT users share IP budgets, replicas multiply local concurrency/rates, and `trust proxy=1` needs infrastructure verification. Do not blindly trust forwarded headers.

## Exact controlled deployment procedure (future approved work only)

Do not perform these steps while the above gates remain open. This run does not authorize push/deployment, install packages or access production data.

1. Record the approved combined commit as `RELEASE_SHA` using `git rev-parse release/all-eight-production-rc`; review its diff against `bbd2104`. Record current Vercel deployment ID plus Node/Python deploy IDs, environment configuration, runtime versions and any storage attachments. Obtain an approved Mongo backup and tested restore procedure, and preserve existing Python account storage. No backup was accessed/taken here.
2. Verify effective C1-C5 containment and isolated Mongo acceptance. Schedule a short controlled bookmark/draft transition, with old clients informed that re-sign-in/update may be needed. Disable automatic deployments in existing service settings before any later approved merge/push so publication cannot race backend readiness. Changes to hosting environment can themselves trigger deployment: stage configuration deliberately, not during uncontrolled traffic. Render documents auto-deploy controls and manual commit selection in [Deploying on Render](https://render.com/docs/deploys).
3. After separate approval to publish the commit, make that exact SHA available to the connected repository. Do not deploy an arbitrary moving branch head. In Render, use each existing service's **Manual Deploy > Deploy a specific commit**, selecting `RELEASE_SHA`. No new service or staging infrastructure is required by this procedure.
4. Deploy Node first with the settings above. With root at the repository root and the tracked uncompressed English model, a concrete start command is `OCR_LANG_PATH="$PWD" OCR_UNCOMPRESSED=1 npm start`. Build is `npm ci`. Preserve all other approved runtime variables and provider settings. Do not run `seed:templates`, migration scripts or account modification commands. Verify actual startup, native modules, explicit DB connection success and approved index readiness. `/health` alone is insufficient: it returns a static success and is not a database-readiness test. Observe only sanitized status/metrics.
5. Deploy Python at the same `RELEASE_SHA` while C5-sensitive routes remain restricted. Root directory: repository root. Build: `pip install -r TNT_BRAIN/requirements.txt`. Start: `cd TNT_BRAIN && uvicorn server:app --host 0.0.0.0 --port "$PORT"`. Test `/health` without client documents, plus synthetic multipart/JSON/SSE paths in the authorized acceptance environment. Verify disconnect/timeout cleanup and writable temporary storage. Do not change worker count or attach/move disks as an unreviewed isolation workaround. Shared state remains unsafe even with one worker.
6. Only after both backend acceptance gates pass, configure Vercel **Production** environment values, including `VITE_DRAFT_API_URL`, and create a new build of the exact `RELEASE_SHA` with root `.`, build `npm run build` and output `dist`. Check the deployment's SHA and environment scope before production assignment. Environment changes apply to new deployments and require rebuilding/redeploying; existing artifacts do not acquire new values. See [Vercel environment management](https://vercel.com/docs/environment-variables/managing-environment-variables) and [deployment promotion](https://vercel.com/docs/deployments/promoting-a-deployment). Never promote this run's loopback build.
7. During the controlled window, accept synthetic login/logout, real session issuance/revocation, two-user draft/bookmark isolation, save/reopen/retry/conflict, direct-link refresh, CORS Authorization preflight, legacy-font reload, voice stop/reconnect, OCR, judgement print and multipage exports. Real provider or production synthetic-account testing requires separate operational authorization; none was performed here. Accept formatting changes and visible 413/415/422/429/503/504 recovery. Restore permitted traffic only after acceptance, then monitor without logging content/secrets.

This is backend-first, frontend-last. Old frontend bookmarks may return 401 during the transition; keep the affected feature in the approved maintenance state rather than disabling auth. H4 English-only searchable text and M8 unsupported embeds are intentional behavior limits; Hindi/Marathi searchable OCR remains unsupported. Browser fonts, PDF viewer search/copy and Word/LibreOffice rendering need target acceptance. Sanitizers intentionally remove unsupported HTML/formatting.

## Rollback

- Frontend: restore the saved `bbd2104` Vercel deployment/artifact and its matching environment/routing configuration. This retains the deployed H2/H3 autosave correction but removes new H1/M5 UI. Preserve all browser autosave/unsaved content; old frontend cannot open new personal drafts.
- Retain a compatible authenticated backend read/recovery path for newly saved UserDraft/SavedJudgement data. If withdrawing M5, use an approved maintenance response or authenticated roll-forward; **never restore the old unauthenticated global bookmark Map** for compatibility. Do not weaken auth, drop new collections, reassign records or restore a whole database over post-release writes.
- H4/H5 routes and shared resource utility must roll back as a compatible set; do not remove a utility still imported by OCR/AI routes. Reverting H10 reintroduces XSS. Prefer disabling affected features at an effective boundary rather than restoring exposed endpoints.
- Python: preserve previous deploy/config and existing account storage; return to a known artifact only with C5 restrictions maintained. Do not purge document/account directories as rollback. CSV writes and other completed mutations cannot be undone by code rollback; investigate and restore data selectively only under separately approved procedures.
- Render: existing service > Deploys > saved successful deployment > Rollback > Rollback to this deploy. Confirm artifact retention and environment/secret-file configuration separately; rollback is not a Mongo backup or generic config restore. See [Render rollbacks](https://render.com/docs/rollbacks). Do not automatically resume auto-deploy before the incident is resolved.

Final recommendation: **NO-GO**. Code integration is complete and all executed regressions pass, including the retained H2/H3 correction. A fully enabled combined release remains unsafe without effective C1-C5 containment, real isolated Mongo acceptance, correct hosting/routing/OCR settings, clean target-host dependency/startup verification, client-workload acceptance and a verified backup/rollback plan.
