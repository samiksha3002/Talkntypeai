# Production readiness and customer workflow restoration

> 2026-11-14 incident update: [the customer workflow hotfix](customer-workflow-hotfix.md) corrects frontend Node routing and native English/Hindi fallback on top of d518052. Its shared resolver uses explicit build settings before runtime config, superseding the editor-override behavior described below. Earlier isolated Atlas results are recorded separately at f8a6beb; no database or production service was accessed for this hotfix. Historical security and hosted-release prerequisites remain.

**Decision: NO-GO for a fully enabled production release.** This candidate restores safely scopeable workflows and prepares password compatibility and an isolated Mongo test harness. It does not claim to have verified production, repaired historical ownership, migrated passwords or restored Deepgram/Python PDF access.

Branch: `release/owner-scoped-readiness`; workspace: `C:/Users/hp/Talkntypeai-owner-scoped-readiness`; base: security checkpoint `03d04af`. Combined release `a61714c`, the earlier security branch and all preceding checkpoints remain unchanged. No push, merge, deployment, installation, production database/API access, credential rotation or historical-data migration occurred. Only public Deepgram documentation was consulted remotely.

## Precisely affected workflows

| Prior containment | Customer impact at 03d04af | Current candidate |
|---|---|---|
| `/api/cases` | Add/list/open/edit/delete cases, eCourt text import and diary case hearings fail | Restored with verified sessions and server-derived owner scope on every query/write. Existing request/response shapes retained. |
| `/api/clients` | Add/list/delete clients fail | Restored with verified sessions and atomic owner-filtered deletion. |
| `/api/reports` | Case-hearing PDF downloads fail | Restored; date filters are validated and owner comes from the verified session. |
| `/api/csv-manager` | CSV upload/list fails; local sample download was never blocked | Restored with auth before upload, session-derived row ownership, owner validation after multipart parsing and H5 limits/cleanup retained. |
| `/api/inquiries` | Inquiry add/list/open/edit/delete and diary inquiry follow-ups fail | Still disabled. Inquiry schema has no owner field; historical ownership cannot safely be inferred. Explicit maintenance pages replace misleading forms/lists. Diary explicitly describes its reduced coverage. |
| `/api/team` | Team add/list fail | Still disabled. Schema omits userId despite old route attempting to write it; globally unique email does not establish account ownership. Maintenance pages explain the pause. |
| `/api/payments` | Payment book, income/expense entry and totals fail | Still disabled. Old route wrote null owners without authentication. Returning an empty filtered history or claiming those records would silently misrepresent finances. Maintenance page retains historical data. |
| Four Python document-capable APIs | PDF analysis/timeline, chat with uploaded PDF, AI document generation and streaming generation fail, including JSON-only requests sharing those handlers | Still disabled. Legal AI Hub displays maintenance notices for drafting/PDF chat rather than inviting failing uploads. Separate research remains outside these document paths. |
| `/api/deepgram` and credential refusal | Deepgram English/Hindi dictation cannot start | Still disabled. Native speech in the existing supported browser-language options is preserved. No old key, public key endpoint, VITE secret or hidden fallback is introduced. |

Personal template-based drafts (H1) are distinct from the disabled Python AI document generator. Personal drafts/bookmarks, H2 native speech, H3 conversion and font autosave, H4 Node searchable-PDF implementation, H5 controls, H10 sanitization and M8 exports are retained. Real provider/device/host acceptance remains required; local synthetic checks are not proof of live service quality.

## Owner-scoped restoration

- Cases, clients and CSV already have persisted userId fields. Verified bearer auth precedes restored handlers. Writes assign `req.draftOwnerId`; supplied owner claims are accepted only when matching that identity, for old client-shape compatibility, and never authorize access. Other owner claims receive 403. Case/client document operations include owner in the same atomic predicate; another owner's document returns 404. Admin role has no implicit tenant-data bypass.
- Case edits use a field allowlist and `$set`; ownership, document ID and update operators cannot be mass-assigned. Report queries are session-owned. All restored list responses are no-store.
- Frontend case/client/eCourt/report/CSV/diary calls now use one secure helper directed only to the explicitly configured Node origin. It attaches the verified session, refuses missing/session-changed identity, rejects redirects and limits request duration. CSV lets the browser set the multipart boundary. Uncertain failures instruct users to confirm saved state before retrying; no false guarantee is made that an error means no server write occurred.
- Old browser-only identities must sign in again. Missing/inactive/expired accounts remain denied under H1's existing access policy. No userId/browser-role fallback is added. An additional pre-existing browser testing-admin fallback in Login was removed.
- Existing stored owner values are preserved, not certified historically. Records without matching userId are not reassigned or exposed. Before enabling restored workflows, an authorized operator must confirm historical owner-field validity and account access policy without exporting client records into local tests. Corrupt/forged historical owner values require a separate audited repair plan. Index/performance suitability for representative account sizes also needs acceptance.

## Password hashing and migration procedure

Implemented: new registrations write bcrypt cost-12 `passwordHash` with a random salt and no plaintext `password`. Both normal login and draft-session login share the verifier. Existing plaintext records remain readable with constant-time digest comparison and are not rewritten on login. A present invalid hash fails closed; it cannot fall back to plaintext. Responses/admin projections omit both credential representations. New passwords must be 1-72 UTF-8 bytes; overlong input is explicitly rejected rather than bcrypt-truncated. Existing legacy passwords are not subjected to the new registration limit in normal login; H1's pre-existing draft-session input limit remains.

`passwordHash` is an optional new schema field; legacy `password` is required only when no hash exists. No new collection/index or bulk password write is introduced by this change. No migration is executed, no real password is inspected, and registration/hash tests use synthetic in-memory model overrides.

Future historical migration requires separate approval:

1. Capture an approved backup and validate restore on an isolated target. Confirm the new field is not already occupied by a different credential representation. Inventory counts and formats through authorized operations without printing/exporting password values. Any unexpected representation is a stop condition, not a reason to guess.
2. Deploy and accept the dual-read hash-aware Node code for BOTH login paths before changing existing records. Confirm a real database-backed administrator and synthetic old/new accounts can sign in and use protected features. Keep a hash-aware rollback artifact.
3. Freeze competing credential changes in the approved migration window. For each eligible legacy record, generate its cost-12 bcrypt hash using the installed helper. Perform an audited compare-and-set on the unchanged record/version and absent hash, setting passwordHash and unsetting plaintext together. Handle concurrent changes by skipping/reviewing, never overwriting. Ensure application debug, profiler and command logging cannot capture credentials. No executable production migrator or URI-taking bulk script is shipped here.
4. Legacy values beyond bcrypt's 72-byte limit need an approved password-reset flow, not truncation. Preserve access until the approved transition completes. Any selective session revocation/reset is a separately authorized account action; none happens automatically here.
5. Verify totals, synthetic login checks, unchanged roles/subscriptions/IDs, and absence of credential exposure. Keep legacy verification only for the controlled transition; remove it later only with evidence and a compatible recovery plan. Do not convert hashes back to plaintext or roll back to plaintext-only code after hashed accounts exist.

Historical plaintext remains an unresolved security issue until remediation or effective documented access controls are verified. New-account hashing does not retroactively secure old records/backups.

## Python isolation assessment

The singleton `doc_service` stores one active_db/current_db_dir. `process_pdf` closes its active client, resets process-global Chroma caches, purges document directories and replaces active state. Chat implicitly selects that active database. Python also has a separate compatibility-login store, not verified Node sessions.

Instantiating a service per request or merely adding user-named folders would not establish authorization or prevent global cache/purge interference. Safe restoration needs a verified Node-to-Python identity boundary, explicit opaque document IDs bound to owner, owner checks on every read/write/chat, isolated storage/client lifecycle with no cross-job purge, bounded cleanup/cancellation and two-user/restart tests. Separate worker processes may be needed for Chroma's global lifecycle. This is not safely achieved by a small endpoint ungate, so the existing ASGI refusal and health non-access remain unchanged. No client documents, Python account files or vector stores are read or modified.

## Safe Deepgram restoration prerequisites

No broker is enabled or external provider request made. Current code refuses before microphone/provider use. First revoke the exposed key and approve a genuinely fresh server-only credential; do not reuse the existing exposed value. A fresh credential and secure delivery still require separately authorized operational work.

Deepgram documents `POST /v1/auth/grant` for temporary voice-API tokens, defaulting to 30 seconds, with a Member-or-higher server credential. Tokens must be valid at WebSocket establishment; expiry does not itself end an established connection. See [Deepgram token authentication](https://developers.deepgram.com/guides/fundamentals/token-based-authentication). The installed SDK supports `createClient({accessToken})`; its live client uses bearer WebSocket authentication rather than treating the JWT as a permanent API key.

Required next implementation/acceptance: verified active Node session before granting; fixed provider endpoint; server-only fresh credential; no-store responses; short TTL and safe error handling; per-user/IP grant/concurrency limits and provider spending controls; no credential/token logging or URLs; tests for unauthenticated/inactive users, grant failure, expiry/reconnect and stop-time finals. If immediate session revocation or strict stream-duration enforcement is required, use a reviewed server relay rather than assuming a 30-second grant closes streams. Never distribute the Member key to a browser. Provider grant and WebSocket tests require separate permission and fresh credentials; they were not run.

## Real isolated Mongo preparation and refusal

No mongod/mongosh/Docker executable or running Mongo process was found in the available local inspection. No verified isolated instance is available. **Real Mongo integration, indexes, races, permissions and restart persistence: NOT RUN.** No production or guessed localhost target was connected.

Prepared `tests/local-mongo.verify.mjs` and two executable safety tests. The harness:

- Accepts an explicit absolute installed mongod binary plus `--allow-synthetic-instance`; accepts NO URI argument. It refuses inherited MONGODB_URI/MONGO_URI/MONGO_URL/DATABASE_URL values, even loopback ones, rather than trusting an arbitrary environment.
- Starts its own process on loopback with a fresh synthetic-only temporary data directory and dynamically selected port. It waits for that child's readiness before connecting and verifies its PID, bind address and dbpath before initializing models/writing fixtures. No production seed, environment file or application server is imported.
- Prepares real synthetic hashed users/admin, template, sessions, drafts, bookmarks, cases, clients and CSV rows; tests actual sign-in, authorization, owner denial, duplicate-create/upsert races, atomic revision conflicts, index definitions, expired/revoked/inactive sessions and API/Mongo process restart retention.
- Stops only its owned process, uses bounded startup/connection/socket/HTTP/shutdown waits and retains the synthetic directory. No dropDatabase or recursive deletion is performed. The local fixture instance is no-auth/loopback; application permissions are tested, NOT production Mongo service-account RBAC. TTL index metadata and expiry denial are covered, not a measured background TTL sweep.

Only syntax and refusal/safety tests have run. The real harness itself remains unexecuted and must not be counted as integration PASS.

Exact manual setup, without cloud staging:

1. Obtain installation/startup approval for an approved MongoDB Community binary matching the intended deployment compatibility target. Do not start a normal service with an existing dbpath, use a production clone, or install Docker/cloud infrastructure unnecessarily. No package was installed in this task.
2. Open a test-only shell in this candidate workspace with the four database environment variables absent; do not display their previous values. Keep the current installed project dependencies. Confirm the selected absolute binary exists and is approved.
3. Run `node tests/local-mongo.verify.mjs --mongod "C:\Program Files\MongoDB\Server\<approved-version>\bin\mongod.exe" --allow-synthetic-instance`. Substitute only the approved binary path. The harness chooses a fresh dbpath/port internally; never supply a URI or an existing data directory. A missing binary or environment conflict must fail, not fall back.
4. Review actual results, retained synthetic logs/indexes and restart evidence. Fix failures before release. Separately test an approved isolated auth-enabled setup if least-privilege Mongo credentials/collection-index permissions must be certified. This no-auth fixture cannot certify production RBAC, replica-set/write-concern behavior or real host storage durability.

## Executed local verification

- Final Node regressions: **132 PASS, 0 FAIL**. Python checks: **14 PASS, 0 FAIL**. Chrome scenarios: **100 PASS, 0 FAIL**. Export artifacts: **6 PASS, 0 FAIL**. Total: **252 PASS, 0 FAIL**. Real Mongo is excluded.
- New checks cover owner-scoped case/client operations, forged/mass-assigned ownership, CSV multipart rejection and owner assignment, report PDF text excluding another owner's marker, real add/edit/list UI flows, CSV UI boundaries, report delivery, post-logout denial, explicit maintenance UI, hashed/legacy login compatibility, new-registration hash-only persistence, byte-limit rejection and Mongo invocation refusal.
- An initial full run exposed an unhandled CSV read-stream error when a forged-owner upload was rejected after stream creation. Ownership validation was moved before opening the stream. The 23 affected resource/tenant checks and then all 132 Node checks passed. Failed development runs are not included as successes.
- Production-mode Vite build passed with envFile:false, scrubbed inherited secrets and synthetic loopback settings. Local build is NOT a production artifact. Existing chunk warning remains. Focused lint: 33 JS/JSX/MJS files, zero errors and one CsvCaseManager dependency warning (the same missing fetchCases pattern existed before). Syntax and Git whitespace checks pass. Standard repository ESLint configuration remains a known separate issue.
- Existing H2 transport checks retain the explicit synthetic credential/SDK substitutions; a separate production-path Chrome suite confirms Deepgram denial and native speech. Providers and repositories are synthetic. No actual microphone/provider/production integration is claimed. Logs/build are ignored under `node_modules/.cache/owner-readiness/`.

## Exact manual production prerequisites

- [ ] Close the real isolated Mongo gate above. Verify actual collection/index creation permissions, account/owner shapes, persistence and representative workload behavior. No production database may substitute for missing isolated tests.
- [ ] Verify a real database-backed admin has role admin and obtains a valid Node session. Do not restore static/browser testing identities. Check synthetic admin operations without enumerating client records in this task.
- [ ] Operator confirms historical case/client/CSV userId ownership and active-account policy. Do not claim unowned inquiry/team/payment rows or silently hide their financial/history impact. Approve the explicit maintenance window/messages and ownership-repair work separately.
- [ ] Authorized credential owner revokes exposed Deepgram credentials, inventories old artifacts/log exposure, creates any fresh server-only replacement and verifies no old credential is reused. Review other exposed credentials under the incident procedure. No rotation occurs here; Deepgram remains disabled pending secure grant delivery and acceptance.
- [ ] Approve and execute historical password remediation separately, or verify effective interim database/backup access containment. New registration hashing and dual-read login alone do not close C2. Preserve a hash-aware recovery artifact before allowing new registrations.
- [ ] Record current frontend/Node/Python deploy IDs and approved configs; obtain a managed Mongo backup/PITR marker and validate restore in isolation. Preserve Python users.json/account storage, existing document directories, collections, indexes and browser autosaves. Do not copy client documents into local testing.
- [ ] Confirm Node/Python deployed SHAs and approved Linux runtimes/dependencies. The repo's Render blueprint still incorrectly references TNT-brain rather than TNT_BRAIN and omits Node; do not deploy it unchanged. Python requirements remain mostly unpinned; native-module and clean-host startup evidence is still missing.
- [ ] Confirm all Vercel/Node/Python origins and aliases; the Vercel `/api` rewrite and hardcoded clients do not all use the same hostname. No direct request may be routed to an old uncontained backend to make a feature work. Verify CORS Authorization preflight, proxy trust, body limits/timeouts and resource budgets.

## Deployment order and exact configuration

Use the reviewed candidate SHA, not a moving branch head. No deployment is authorized or executed here. Preserve controlled auto-deploy settings before any later approved publication.

1. **Node first:** repository root, build `npm ci`, start `OCR_LANG_PATH="$PWD" OCR_UNCOMPRESSED=1 npm start` for the tracked uncompressed English model. Set NODE_ENV=production, explicit MONGODB_URI (or intentional MONGO_URI), Render PORT and existing provider settings for enabled features. No new password salt/signing environment variable is needed. Keep the Deepgram key endpoint and inquiry/team/payment maintenance boundaries. Do not run password/ownership migrations or seed scripts as a build/predeploy hook. Check DB readiness explicitly; static `/health` is insufficient.
2. **Python second:** repository root, build `pip install -r TNT_BRAIN/requirements.txt`, start `cd TNT_BRAIN && uvicorn server:app --host 0.0.0.0 --port "$PORT"`. Retain OPENAI_API_KEY/TAVILY_API_KEY and other approved enabled-feature settings. Keep all four document-capable paths blocked and existing storage/worker settings intact. Do not swap to shared-state workers as a workaround.
3. **Frontend last:** Vercel repository root, Vite, install `npm ci`, build `npm run build`, output `dist`. Set Production VITE_DRAFT_API_URL to the correct HTTPS Node origin; it now governs drafts/bookmarks/admin AND restored tenant workflows. Set VITE_API_URL consistently and verify `/config.json` API_URL, which overrides the editor origin. Preserve VITE_TNT_AI_API_URL as appropriate. No provider secrets belong in VITE variables. Build a fresh production-configured artifact, not the local loopback build.
4. During the approved transition, accept synthetic hashed/legacy login, session revocation, admin negative checks, two-owner case/client/draft/bookmark/CSV isolation, add/edit/delete/report flows, actual reload/font preservation, OCR and exports. Keep paused APIs at no-store 503 and show maintenance screens. Accept native speech only with separately authorized device/vendor traffic. No real client records/documents should be used for this smoke session.
5. Check precise SHAs, error/status counters, timeout recovery, ownership denial and the approved maintenance impact before opening traffic. Do not log credentials, tokens or document bodies. Old clients need the matching frontend and re-sign-in; no authentication bypass is an acceptable compatibility fix.

Existing H5 resource variable names/defaults and all provider/environment requirements remain in [the combined runbook](combined-production-release.md); security rollback constraints remain in [the containment runbook](security-containment-release.md), with the hash-aware restriction below taking precedence.

## Rollback and stop conditions

- Never roll Node back to a61714c/bbd2104: that reopens admin/key/tenant exposure. Never restore shared Python PDF access merely for compatibility. Keep reviewed authorization/maintenance boundaries or a verified external deny at every direct origin; prefer security-preserving roll-forward.
- Once new hash-only accounts exist, **03d04af is also not a valid authentication rollback binary**: it cannot verify their passwordHash field. Keep the hash-aware verifier/model and a tested compatible artifact. Source commit `274f05d` is a candidate for preparing a hash-aware, fully contained fallback (before tenant restoration); it is not an inspected production backup or a prebuilt rollback artifact. Never restore plaintext or change user records to make an old binary work.
- Do not restore a frontend that redistributes the exposed credential. Retain maintenance/containment UI and preserve browser autosaves and unsaved text. Maintain credential revocation through rollback.
- Preserve new draft/bookmark/session collections and post-release writes. Code rollback does not undo mutations; do not drop collections, bulk-reassign ownership, clear storage or restore a whole DB over newer writes. Restore data selectively only with separate authorization and verified backup evidence.
- Stop immediately on cross-owner results, unexpected credential representation, auth/session failures, Mongo identity guard failures, missing backup/restore evidence or routing to an old backend. Failed local integration is never a reason to test production instead.

**Final recommendation: NO-GO for a fully enabled all-eight release.** Restored owner-scoped workflows and new-account hashing are implemented and locally verified. Historical password/ownership work, already-exposed credentials, real Mongo verification, hosted configuration/device/provider acceptance and a verified hash-aware backup/rollback plan remain manual gates. Full Python PDF/AI drafting and Deepgram restoration cannot be safely claimed in this run.
