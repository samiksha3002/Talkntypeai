# H2/H3 production-baseline candidate

Decision: NO-GO for deployment; local H2/H3 integration and verification PASS. No production access, database connection, external provider calls, push, deployment, migration, secret change or dependency installation occurred.

## Baseline and integration

- User-confirmed Vercel production: main at 47d04c39c205021a3f83c96a4cf349f6603e15df. This commit exists locally. The production designation comes from the user; no hosting account was accessed.
- New branch: release/h2-h3-production-rc. Workspace: C:/Users/hp/Talkntypeai-h2-h3-production-rc. Its parent/base is exactly 47d04c3.
- Previous candidate: release/h2-h3-local-rc at e15c6a03da7f85b198a30542528bbdc6436780b8. Its common ancestor with production is 621cb2762d8150de7436d508c5b83aba52fdf834. It contains the H2/H3 implementation and autosave font correction.
- Reviewed the diff from that common ancestor before applying an explicit file-allowlisted patch. git apply --check and application succeeded with ZERO conflicts. No whole-file replacement was used to resolve differing baseline implementations.
- Production's four unique changed files (package.json, package-lock.json, routes/audio.js and src/Editor/editor.api.js) do not overlap the patch and remain identical to 47d04c3. Existing file-audio upload behavior and dependency updates are retained. Unchanged functionality is preserved in source; live file-audio/provider acceptance was not attempted.
- Six runtime files and five verification files match e15c6a0 exactly, with line-ending normalization. Only this release report is rewritten for the confirmed baseline.
- Existing branches/checkpoints remain at e15c6a0 and baf8d55 respectively. No existing worktree was edited by the integration.

## Complete change manifest against 47d04c3

Runtime:

1. src/Editor/Editor.jsx -- identified speech-event consumption, remembered caret, atomic font conversion and root-font restoration.
2. src/Editor/speech.js -- provider final-event identity, command handling and insertion helpers.
3. src/Editor/fontConversion.js -- whitespace-safe Delta conversion, response validation and concurrent-edit protection.
4. src/Editor/editorAutosave.js -- compatible HTML persistence plus content-matched allowlisted root-font metadata.
5. src/components/Dashboard.jsx -- queued speech, initial autosave/font loading and persistence.
6. src/components/Sidebar/Stenocard.jsx -- final utterance adapters and stop-time audio flushing.

Verification: tests/h2-speech.test.mjs, tests/h3-font.test.mjs, tests/h3-autosave.test.mjs, tests/h2h3-browser.verify.mjs, tests/fixtures/h2h3-browser.jsx. Documentation: docs/H2-H3-release-candidate.md.

Everything else remains identical to 47d04c3. No H1/H4/H5/H10/M5/M8 implementation, auth/backend/Python/configuration/mapping/font-asset change is included. Unrelated baseline vulnerabilities remain.

## Executed checks

- Node regressions: 34 PASS, 0 FAIL (H2 14, H3 15, autosave 5).
- Actual local headless Chrome: 30 PASS, 0 FAIL (H2 10, H3 5, ordinary editor 2, release persistence 13). Real React Dashboard/Sidebar/Editor/Quill execute against the unchanged loopback Express font route. Microphone/Deepgram/native-recognition inputs are synthetic, providers are stubbed and browser external traffic is blocked with a dead loopback proxy.
- Total: 64 PASS, 0 FAIL. Includes repeated final utterances, interim rejection, commands, stop-time finals, blurred caret, formatting/paragraph preservation, whitespace-only request avoidance, in-flight edit protection, legacy-font autosave/remount, two actual page reloads, old English/Unicode/inline-KrutiDev autosaves, repeated reopen and speech after reopen.
- Isolated Vite production build PASS: envFile:false, inherited credential/environment variables scrubbed from the child process, synthetic loopback API definitions, ignored output under node_modules/.cache/h2h3-production-release/build. No runtime endpoint is called. Existing approximately 3.05 MB main chunk warning remains. This synthetic build is not a deployable production artifact/configuration acceptance.
- Focused lint: 0 errors, 1 unchanged Stenocard hook-dependency warning. Eleven source/test syntax transforms PASS. Existing font route, dispatcher and production editor.api.js Node syntax checks PASS. Git whitespace check PASS.
- Standard repository lint retains its previously identified eslint.config.js hooks-plugin configuration failure. It is not represented as passing and was not changed.
- Reused the preinstalled dependency tree through an ignored junction; no installation. All direct dependencies match the production lockfile. Of its installed package entries, 696 versions match with no differences; 66 lock entries are absent. A fresh clean lockfile installation and target-host build remain unverified (platform/optional packages were not installed or repaired).
- Logs/build: ignored node_modules/.cache/h2h3-production-release/. Previous candidate branches and reports are retained separately.

## API, configuration and data compatibility

- Existing POST /api/font/convert accepts JSON {text, conversionType} and returns JSON {success:true, convertedText:string}; validation, mapping registry, supported conversions and 100,000-character limit remain unchanged. The server mount and dispatcher are identical across the common ancestor and 47d04c3. Local synthetic HTTP integration passes. Actual deployed Node/Python SHAs and the live API contract have NOT been confirmed by the Vercel frontend SHA.
- Editor initializes from VITE_API_URL, then /config.json API_URL overrides it. Both must resolve consistently to the intended HTTPS Node origin, without an extra /api suffix. Verify that frontend origin is allowed by backend CORS and JSON preflight. Absolute-origin calls do not rely solely on Vercel /api rewrites. No new environment variable is required; VITE_DRAFT_API_URL, new Mongo collections/indexes and Python changes are unnecessary.
- Release all six runtime files together. React, react-quill-new and @deepgram/sdk are existing dependencies. HTTPS microphone permissions, MediaRecorder/getUserMedia and supported native SpeechRecognition behavior are still required. Browser-native recognition may itself use vendor services. Existing font assets must load under KrutiDev/Shivaji01/Preeti family names; target-device glyph fidelity is unverified.
- autosave_<owner> stays plain HTML. Companion autosave_font_<owner> stores versioned, allowlisted root-font metadata bound to exact HTML; stale/malformed metadata is ignored. Old saves load unchanged with no font/encoding inference. Previously lost historical font selections cannot safely be reconstructed. Quill content/selection and H2 algorithms are unchanged by restoration. Clear removes both records.
- Browser storage availability/capacity and the existing one-second debounce still apply; closing before a completed autosave is not durable saving. Companion metadata duplicates HTML for exact matching. No live browser profile, real client document or database record was read or migrated.

## C1-C5 containment and remaining blockers

These are recommendations for separately authorized operations/security work; none was executed:

- C1: deny public admin-route access until authenticated administrator authorization is enforced server-side. UI hiding and CORS do not provide authorization.
- C2: restrict unrestricted user-record responses, exclude password fields, and implement a compatible plaintext-password remediation/account recovery plan before treating account storage as secure.
- C3: disable static administrator login bypass. A long-lived Deepgram credential remains in browser source; do not publish it as if this patch solved credential exposure. Revoke/rotate exposed credentials and replace delivery with authenticated scoped short-lived access. VITE variables would still expose a credential in bundles. No credential values are reproduced here.
- C4: restrict affected legacy case/client/payment/report/team/inquiry/CSV/bookmark routes until each operation enforces authenticated ownership. The baseline still has the shared unauthenticated bookmark implementation; M5 is deliberately excluded.
- C5: disable or effectively restrict shared Python PDF upload/analysis/chat/generation until authentication and tenant-scoped document state are enforced. Locks/rate limits do not separate tenants.
- H10 is excluded; existing judgement HTML exposure also remains outside this candidate.

Unverified: deployed backend/Python revisions, hosted API/CORS/config/caching, actual microphone permissions and provider stop/reconnect behavior, supported mobile/browser combinations, target-device legacy-font appearance, fresh lockfile installation/host build, and operational rollback readiness. Synthetic provider tests do not certify these. No real Mongo integration is required by H2/H3; existing production DB safety/backup procedures remain operational dependencies outside this task.

## Smallest controlled rollout and rollback

1. Preserve current Vercel artifact/config and confirm which Node/Python deployments serve it. Review this exact 47d04c3-based diff; resolve C1-C5 containment and credential exposure through approved work.
2. Accept actual microphone/provider and legacy-font behavior using synthetic documents in an approved private/local HTTPS preview or a tightly controlled acceptance session. Do not use client documents. Complete the clean lockfile/target-host build and verify API origins/CORS.
3. If the deployed font API already meets the unchanged contract, deploy frontend ONLY through a separately approved release. No Node/Python/database deployment is required by H2/H3. Any necessary backend correction must be separately reviewed and deployed compatibly before the frontend.
4. Smoke-test a controlled synthetic session and monitor sanitized error/status metrics. Stop on content loss, wrong font rendering or speech duplication. Never log document bodies, bearer tokens or credentials.
5. Rollback: restore the exact prior 47d04c3 frontend artifact AND its build/runtime configuration, handle caches, stop active dictation, and preserve/copy unsaved content before reload. Preserve browser autosave HTML and companion metadata; do not clear client storage or collections. Older frontend artifacts still read the plain HTML but ignore root metadata and restore the previous font-loss defect. No database migration/restore is introduced. Keep the existing backend and do not weaken authentication for compatibility.

Recommendation: local integration PASS; production deployment NO-GO until remaining security/hosted acceptance gates are satisfied. The Vercel baseline mismatch is resolved using the user's confirmed SHA. No release has been deployed or pushed.
