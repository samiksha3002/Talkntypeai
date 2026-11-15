# Customer workflow incident hotfix - 2026-11-14

Branch: `hotfix/customer-workflows-20261114`. Worktree: `C:/Users/hp/Talkntypeai-customer-hotfix`. Fetched `origin/main` was exactly `d518052979a484a1eb1b4ec676998fb2b48dc29c`; the new branch starts there. Existing checkpoints are preserved. Backend code, models, authentication, ownership and database contents are unchanged.

## Causes and corrections

| Incident | Source evidence | Correction / remaining action |
| --- | --- | --- |
| Draft Studio requires VITE_DRAFT_API_URL | Secure draft/bookmark/admin/tenant wrappers accepted only that setting, absent from checked-in production configuration. | Shared `src/nodeApi.js` resolves VITE_DRAFT_API_URL, then VITE_API_URL, then runtime config.json API_URL, then same-origin /api when runtime config is absent. Auth/ownership controls remain. |
| Inconsistent routing | .env.production contained `talkntype-backend.onrender.comnode`; Vercel rewrote to `talkntype.onrender.com`; runtime config and most clients used `talkntypeai.onrender.com`. Editor runtime config overrode explicit build settings. | User confirmed the last origin from Render. Production variables and rewrite now agree. Runtime config is a fallback. Login/register, secure workflows, editor helpers and judgement client share the resolver. Only HTTPS origin or origin/api is accepted, without credentials/query/fragment/arbitrary paths; loopback HTTP remains permitted for development/testing. |
| Login 404/400; admin failure | Node already mounts real auth at /api. Its JSON 404 means no exact DB email match; JSON 400 means invalid credentials/input. A routing HTML 404 is different. Static admin login was deliberately removed. No production account/request trace was inspected. | Correct routing, trim email without altering passwords, bounded request, actionable non-JSON routing error. A 200 lacking a real session no longer announces usable login. Hashed database-backed admin login passes synthetic HTTP/Chrome checks. Real production admin identity remains a manual prerequisite. |
| Anticipatory Bail unavailable | Static examples stayed clickable during catalog failure and when absent. Matching used only trimmed/lowercased titles. The seed contains Rent Agreement, Payment Legal Notice, Regular Bail Application and Civil Suit, not Anticipatory Bail Application. | Distinct loading/outage/empty states; absent static examples are visibly disabled. Ambiguous static examples direct users to actual DB choices, which remain individually usable/searchable by ID even when titles repeat. Whitespace/case normalization never aliases regular bail to anticipatory bail. Production content remains unverified; separate recovery procedure below. |
| English/Hindi speech blocked | Both preferred Deepgram; the credential function intentionally throws before microphone acquisition. Only other languages used native speech. | Source-controlled false DEEPGRAM_ENABLED gate preserves containment. English uses en-IN, Hindi hi-IN, through browser recognition. Support/permission/language/network errors give inline retry/typing guidance. No key endpoint or provider access was restored. |

Browser verification caught an async-resolution logout regression during development. Logout now captures the token before clearing local access and revokes that exact token afterward. Authenticated clients reject session changes during resolution. An intermediate syntax error and test-only unsupported-browser setup were also corrected. Final passing runs supersede those failed development runs; no security check was removed.

## Verification and limits

Final results: **296 assertions PASS, 0 FAIL** across the categories below. All new execution uses synthetic repositories/accounts/documents and loopback HTTP. Provider/recognizer behavior is substituted; no real microphone, provider, production service or database was contacted. No dependencies installed. Timeouts bounded each test/build process; intermediate failed development runs are excluded from this final total.

- Node: 139 PASS, 0 FAIL, 0 SKIP, including existing eight-fix/security checks and seven incident tests.
- Chrome: **137 PASS, 0 FAIL**, across eight scenario runs: incident/runtime config 16; incident/same-origin fallback 16; H1 with VITE_API_URL alone 27; H2/H3/editor/reload 30; production-path speech/admin security 11; tenant workflows 7; H10 16; M5/M8 14. Deepgram transport checks in H2/H3 still substitute both the credential module and SDK with synthetic implementations; the separate security suite exercises the real production false gate and native fallback. No real provider acceptance is claimed.
- Python: 14 PASS, 0 FAIL (10 resource/upload and four containment checks).
- Six PDF/Word artifact checks cover Unicode extraction, DOCX XML, multipage completeness and nonblank PDF rendering.
- Focused lint: 20 changed/new JS/JSX/MJS files, zero errors/warnings, recommended JS/hooks rules using an isolated configuration. Repository ESLint still exits 2 while loading its pre-existing `reactHooks.configs.flat.recommended` reference. Its configuration was not changed.
- Isolated Vite production-mode build passes with envFile:false and synthetic API settings. Existing >500 kB chunk warning remains. Ignored output under node_modules/.cache/customer-hotfix is not a deployment artifact.
- Earlier Atlas evidence at f8a6beb remains 14 real synthetic groups PASS, not rerun here. This hotfix changes no backend/model/schema. No production data/index compatibility, Atlas restart/failover, backup restore or hosted integration is claimed.

Existing test entrypoints: `node --test tests/*.test.mjs`; `node tests/customer-hotfix-browser.verify.mjs` (also `--same-origin`); `node tests/h1-browser.verify.mjs --general-api-only`; the existing h2h3/security/tenant/h10/m5-m8 browser entrypoints; `python tests/h5_brain_test.py`; `python tests/security_brain_test.py`. The executed subprocesses scrubbed database/provider variables and Node preloads. Logs and local-only build/lint runners are ignored under `node_modules/.cache/customer-hotfix/`. Git whitespace validation passes. Repository lint was invoked via its installed ESLint entrypoint, equivalent to the package's lint script, without installing tools.

## Exact hosting settings

Vercel dashboard overrides take precedence over tracked defaults. Set both in the intended Production environment and rebuild:

```text
VITE_DRAFT_API_URL=https://talkntypeai.onrender.com
VITE_API_URL=https://talkntypeai.onrender.com
```

Do not append endpoint paths or a doubled /api; one trailing /api is normalized. No Mongo URI, password, token or provider secret belongs in VITE variables. Preserve VITE_TNT_AI_API_URL only for its separately approved existing chat workflow; it is not the Node login/draft origin. Runtime config retains that same Node origin. Vercel rewrites `/api/(.*)` there before the SPA fallback. Explicit build settings now win over runtime config.

Render Node d518052 needs **no code deployment or new setting** for this frontend-only hotfix. Operator must verify the service/origin and intended existing application database privately. Never use the synthetic URI in production. Preserve NODE_ENV=production, Render-managed PORT and intended MONGODB_URI (or intentional MONGO_URI). Existing build is `npm ci`; documented OCR start is `OCR_LANG_PATH="$PWD" OCR_UNCOMPRESSED=1 npm start` for the tracked uncompressed model. Do not alter working runtime/storage/provider settings incidentally or attach migrations/seeding to build hooks. Session collection writes and token unique/expiry indexes must remain permitted.

Node CORS currently permits https://talkntype.pro and https://www.talkntype.pro, historical aliases and local development. Confirm the actual frontend origin and Authorization preflight. An unlisted preview/custom domain needs a reviewed exact allowlist entry, never wildcard credentials or an old backend. Proxy/direct paths must reach the same contained service. Static /health alone is not DB readiness. Python needs no rollout/settings change. Do not apply the known incorrect render.yaml blueprint during this incident.

## Manual prerequisites

1. A legitimate production admin must exist in the intended users collection with stable _id, exact registered email, supported password/passwordHash representation and role exactly admin. An authorized operator must verify identity and use an approved account-recovery/role procedure if missing. Reserved email, browser storage or static identities grant nothing. No account/role was fabricated or changed here.
2. Ordinary users need active/unexpired subscription access. Verify session/index privileges without logging credentials if session creation fails. No password/ownership migration is part of this hotfix.
3. A genuinely missing template needs approved professional content and backup before a separate insert-only operation. See [template recovery](template-recovery-procedure.md). Existing saved drafts remain accessible independently of catalog availability.
4. C1 verified-role checks and C4 tested owner predicates remain. Verify historical owner shapes separately; inquiry/team/payment stay at 503. C5 shared-state Python document paths stay disabled.
5. C2 historical password remediation or documented effective interim DB/backup containment remains required. C3 exposed-key revocation must be confirmed by its authorized owner; no credential was inspected or rotated.
6. Deepgram restoration requires fresh server-only credentials after revocation, an authenticated and rate-limited relay or supported short-lived scoped grants, session/resource/expiry checks and provider acceptance. Never return a reusable key or simply enable the source flag. Real native support still depends on browser/language, microphone permission and speech-service availability; device/vendor checks were not executed.

## Smallest controlled rollout

1. Operator records Vercel/Node/Python deployment IDs and settings, backup/PITR/restore evidence and maintenance impact. Preserve browser autosaves and newer writes. This hotfix requires no database mutation.
2. Keep Node d518052 and contained Python in place. Verify the confirmed origin/settings. A wrongly deployed backend is a separate controlled action; no backend rollout is otherwise required.
3. After separate release authorization, review the hotfix SHA and Vercel settings, build/publish frontend only. Repository root, Vite, `npm run build`, output dist, existing lockfile/install policy. Do not publish the local synthetic artifact. No push/deploy is authorized or executed in this task.
4. Approved smoke session uses designated synthetic accounts/documents: login/admin negative checks; catalog and absent-template state; draft create/save/list/load/reload; two-owner denial and logout revocation; English/Hindi native behavior; root-font persistence; PDF/Word exports. Verify both API routing paths, status counters and Authorization preflight. Do not use client data.
5. Stop on wrong origin, cross-owner/anonymous access, exposure, failed save/reload or session failure. Keep paused services contained. **No unconditional production GO** is established by local verification.

Rollback is frontend-only to a recorded contained, credential-free artifact with matching reviewed API settings. Returning to d518052 frontend restores the known incident behavior and needs explicit impact acceptance. Preserve Node/Python security boundaries, revoked keys and hash-aware authentication. Never roll Node back to a61714c/bbd2104, or 03d04af after hash-only registrations. Do not clear autosaves, drop collections, reassign ownership or restore an old DB over newer writes. Prefer a contained roll-forward if an older frontend exposes keys or mismatches routing. Unverified credential containment, legitimate admin identity, historical compatibility and backup/restore remain operator release gates.
