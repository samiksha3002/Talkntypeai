# OCR-resource-only release candidate

Prepared on `hotfix/legal-ai-d518052` at HEAD `7314f6d5a88ae15dab90abb0f1ce93f82cf41506`.
Date: 16 November 2026. No commit, push, deployment, live environment update, provider migration or client-document processing performed.

## Scope

This candidate addresses only the Searchable PDF failure `Local OCR language resources are not configured`, including English/Hindi/Marathi resources and the Unicode search layer those languages require. It does not contain the unfinished 50 MiB implementation.

Included changes:

- Build-time provisioning of checksum-pinned English, Hindi and Marathi tessdata_fast 4.1.0 models into a server-local `ocr-data` directory. Runtime paths are resolved relative to the module, so startup working directory and an absent `OCR_LANG_PATH` do not break the default configuration. There are no document-triggered model downloads.
- All three local language files must be present. An explicitly configured incomplete/missing directory fails with a clear 503 identifying missing languages, before worker creation.
- `npm run build` runs provisioning and real English/Hindi/Marathi recognition checks before Vite. A small rasterized Devanagari fixture makes the build check independent of Linux system font availability.
- The existing native canvas package is explicitly declared at the already-installed/locked 0.1.80 version.
- Hindi/Marathi OCR words use invisible Unicode ToUnicode mappings. Original page appearance, dimensions, crops, rotations, image resources and existing PDF response contracts are preserved. Latin text keeps its existing rendering path.
- A read-only `GET /api/ocr/status` reports local resource availability, selected languages and the existing configured Searchable PDF upload limit. It does not run recognition and is not a substitute for the build smoke check.

The release allowlist is:

1. `.gitignore` (ignore build-generated language files only)
2. `package.json`
3. `package-lock.json`
4. `utils/searchablePdf.js`
5. `routes/searchablePdf.routes.js`
6. `scripts/provision-ocr.mjs`
7. `scripts/check-ocr.mjs`
8. `tests/h4-pdf.test.mjs`
9. `tests/ocr-resource-release.test.mjs`
10. `tests/fixtures/ocr-devanagari.png`
11. `tests/fixtures/legal-scan-a4.pdf`
12. `docs/OCR-resource-only-release.md`

Pre-existing tracked/untracked Python cache changes remain untouched and are **not release content**. Do not stage all worktree files indiscriminately.

## Upload limits and working features retained

`utils/resourceProtection.js`, both full-PDF/provider and legal-workspace routes, frontend API/routing files, Python workspace boundary/service files and Vite configuration match HEAD exactly after normalizing checkout line endings. No upload, page, timeout, raster or concurrency default was changed. No Render environment variable was changed.

The branch's existing code defaults remain:

| Path / setting | Existing value retained |
|---|---:|
| Searchable PDF `SEARCHABLE_UPLOAD_MB` | 25 MiB, or the existing environment override |
| General document upload `DOCUMENT_UPLOAD_MB` | 100 MiB, or the existing environment override |
| Authenticated legal workspace PDF file | 10 MiB |
| Legal workspace multipart body | 11 MiB |
| Existing document pages / deadline | 500 / 600 seconds, or existing environment overrides |
| Shared document concurrency | 2, or the existing environment override |

These are the code baseline values, not an inspection of live Render environment values. The existing environment remains authoritative and must be preserved. No 50 MiB limit, new stream gateway, child-process OCR architecture, cgroup monitor, 150-DPI change, Python limit expansion or full-PDF provider replacement is included. The existing full-PDF/image-to-text providers, authentication, owner scoping, private request-local retrieval, maintenance containment, editor fixes and production routing remain unchanged. Searchable conversion remains local; user scans are not sent to a model download service or added to new logs/stores.

## Unfinished work preserved separately

The complete pre-split state was copied and SHA-256 verified in:

`C:\Users\hp\Talkntypeai-ocr-50mib-preserved-20261116`

Branch: `wip/ocr-50mib-preserved-20261116`, based on the same HEAD without a new commit. It contains the full uncommitted 50 MiB port, memory guards, streaming gateway changes, tests/generators, language assets and readiness reports. Its file hashes still match the preservation manifest. Dependencies were not installed into this new worktree; install them independently before later WIP execution.

An additional byte-for-byte file backup, full binary diff, initial status and SHA-256 manifest are retained at:

`C:\Users\hp\AppData\Local\Temp\tnt-ocr-only-release-02hl4b70`

The original source worktree `C:\Users\hp\Talkntypeai` remains unchanged: all 270 recorded source-file hashes match the original manifest. The target's pre-existing cache modifications also match their original hashes. Only the OCR allowlist above should enter a future release.

## Verification executed

- **35 focused tests passed**: `node --test --test-concurrency=1 tests/h4-pdf.test.mjs tests/h5-resources.test.mjs tests/ocr-resource-release.test.mjs`.
- Actual local worker initialization and English, Hindi and Marathi recognition passed in `npm run ocr:check`; all three model checksums verified with `npm run ocr:provision`.
- A real HTTP request containing a small three-page synthetic scanned legal PDF returned a valid searchable PDF. English, Hindi and Marathi text extracted correctly, all three pages remained, and rendered output pixels matched the input exactly. The sampled local process RSS during this conversion was **281.4 MiB**. This was a Windows measurement without a hard memory cap; it does not certify Render runtime memory.
- Regression checks covered images, blank pages, rotations, crop offsets, word geometry, missing/partial language data, no download on missing runtime data, cancellation, timeouts, upload/rate/concurrency protection, temporary cleanup and existing provider/CSV contracts.
- Production build passed, including the model provisioning/three-language smoke prebuild. Since local dependencies are a junction into the source worktree, the build used a temporary wrapper around the unchanged Vite configuration solely to place cache files in the target: `npm run build -- --config .ocr-release-build.config.mjs`. That wrapper was deleted afterward and is not release content. The normal Render build command is `npm ci && npm run build`. Vite reports its existing large-bundle warning.
- `git diff --check` and release-scope/baseline-limit/WIP-integrity/source-integrity assertions passed. No broad test suite was repeated.

## Actual Render service result

Small public-service probes against `https://talkntypeai.onrender.com`:

| Check | Observed response |
|---|---|
| `GET /health` | 200 |
| `GET /api/ocr/status` | 404; branch diagnostic route is not available live |
| `POST /api/ocr/pdf-to-searchable-pdf`, one tiny synthetic English scan | **503**, `Local OCR language resources are not configured.` |

No confidential document was used. The tiny smoke scan was generated locally for this check. The live service is therefore **still failing**; this candidate has not been deployed and the production error is not claimed fixed.

A Render plugin exists but is not installed/connected in this session. No service account access, shell, build logs or runtime environment was available. No Render configuration change was attempted; environment edits can trigger deployments and the user prohibited deployment.

## Required Render configuration for the future release

Apply/review these on the **existing Node API service serving the confirmed origin**, while retaining all existing service routing, secrets, auth configuration, start command and upload-limit environment values:

1. Build from the repository root containing `package.json`. Build command: **`npm ci && npm run build`**. The package prebuild must actually execute; installation alone or a frontend-only `vite build` invocation does not provision the server's resources.
2. Retain the existing Node start command, normally `npm start` / `node server.js`. Use a compatible Node runtime (the PDF.js dependency requires >=20; local tests used 22.12.0). Do not omit required native optional platform dependencies. The Linux canvas/WASM loads must pass `npm run ocr:check` in the actual build/runtime environment.
3. Allow the build to download the pinned public language models from `raw.githubusercontent.com`, or pre-provision the exact checked models. Confirm `eng.traineddata`, `hin.traineddata` and `mar.traineddata` remain in the deployed **server-local** `ocr-data` directory, not merely in a frontend build cache.
4. Prefer **unset `OCR_LANG_PATH`** for this candidate's module-relative default directory. If a custom path is intentionally retained, it must be the actual local directory containing all three models. For the provisioner's uncompressed models set `OCR_UNCOMPRESSED=1` when a custom path is used; a custom gzip directory must contain all three `.traineddata.gz` files with matching gzip configuration. Remove/correct any stale path rather than pointing to a guessed host-specific absolute directory. With the default directory, `OCR_UNCOMPRESSED` is not needed.
5. **Do not change** `SEARCHABLE_UPLOAD_MB`, `DOCUMENT_UPLOAD_MB`, legal-workspace upload limits, resource limits or other existing production settings as part of this release. Do not add 50 MiB settings.
6. Do not apply/repurpose the repository's old Python `render.yaml` for this Node fix; it references the nonexistent `TNT-brain` directory and is not evidence of the running Node service's configuration. Review the actual existing service instead.
7. During an authorized later rollout, require the three-language build smoke to pass, inspect `/api/ocr/status`, and repeat tiny English/Hindi/Marathi Searchable PDF smoke checks on the actual service. Verify text extraction and layout, not just HTTP 200. This final live confirmation necessarily follows a future authorized release; no deployment was performed here.

## Readiness

**Scoped local release candidate: prepared and tests/build passed. Production sign-off: blocked pending actual Render configuration/native-runtime verification and an authorized later rollout smoke check.** The current live service still returns the original 503. The unfinished 50 MiB work is excluded and safely preserved. No claim of 50 MiB support or hard-512-MiB production certification is made.
