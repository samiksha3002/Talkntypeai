# OCR and 50 MB PDF changes — local verification

Date: 16 November 2026. No push, commit or deployment performed. All test documents are synthetic.

## Fixes

- Replaced the mandatory, unprovisioned `OCR_LANG_PATH` requirement with a bundled local `ocr-data` directory. `npm run build` now runs a prebuild step that provisions checksum-pinned English, Hindi and Marathi tessdata_fast 4.1.0 models, then initializes the actual installed Tesseract/WASM/native canvas dependencies and recognizes a smoke-test image. Models download at build time only, never in response to a document upload. Existing custom `OCR_LANG_PATH` / `OCR_UNCOMPRESSED` configurations remain supported; only locally available languages are loaded, and missing English data returns 503.
- Declared the already-used `@napi-rs/canvas` native dependency directly and pinned it to the locally tested version, instead of relying solely on PDF.js's optional dependency.
- Full PDF OCR (`/api/upload-pdf`) now uses the same local engine as Searchable PDF. It no longer sends a complete PDF to Gemini. Existing route names, multipart fields and JSON/PDF response contracts are preserved. The separate image-to-text cloud route and Python legal-analysis services retain their existing behavior; this is not a claim that every app feature is offline.
- Original PDF pages, images, crop boxes and rotations remain in the output. Native text is retained; digital-only pages skip recognition. Mixed pages receive OCR with a native-text overlap filter. Unicode ToUnicode mappings support Hindi/Marathi searchable text without substituting visible fonts or altering scans. Selection geometry is word-level and approximate.
- Conversion runs in a disposable child process, with one-page raster/OCR batches and explicit PDF.js cache cleanup. Uploads and results use private temporary files; PDF results stream to the response. Input/output files and workers are cleaned on completion, failure and cancellation. Results use `Cache-Control: no-store`. No document text is added to diagnostic logs.

## Limits

“50 MB” in the interface means **50 MiB = 52,428,800 bytes**. Both frontend PDF workflows enforce that boundary. Node PDF extraction uses `PDF_UPLOAD_MB=50`; Searchable PDF uses `SEARCHABLE_UPLOAD_MB=50`. Existing generic CSV/image upload defaults remain unchanged. Python PDF upload defaults are also 50 MiB, with a 51 MiB total multipart body allowance.

Node defaults:

| Setting | Default |
|---|---:|
| PDF_UPLOAD_MB | 50 |
| SEARCHABLE_UPLOAD_MB | 50 |
| DOCUMENT_CONCURRENCY | 1 shared active document job |
| DOCUMENT_MAX_PAGES | 100 |
| DOCUMENT_TIMEOUT_MS | 180000, including upload; child also has a hard processing deadline |
| DOCUMENT_MAX_IMAGE_PIXELS | 12000000 at 200 DPI |
| DOCUMENT_MAX_RASTER_PIXELS | 500000000 cumulative |
| OCR_PROCESS_BUDGET_MB | 420 MiB combined parent + OCR child RSS |
| Child V8 old-space ceiling | 192 MiB; does not bound native/WASM memory |

Excess upload/page/pixel/memory work returns 413; busy capacity returns 503; cancellation/deadline returns 504. Memory/deadline failures do not return partial PDFs. The Linux parent samples `/proc/<child>/status` every 50 ms, including native canvas/WASM/worker-thread memory, and kills work beyond the combined RSS budget. Cross-platform child RSS reports supplement this. **Sampling is not a hard OS cap:** rapid transient allocations, other processes and cgroup-accounted file cache can still exceed available memory. The original PDF and output are still materialized inside the child; page batching does not make arbitrary PDFs constant-memory.

The separately hosted Python upload validation uses the same default page/pixel bounds. Python vision OCR now rejects documents beyond its page limit instead of silently OCRing only the first 25 pages. Its cloud analysis stack has not been certified under 512 MiB.

## Executed checks

- 51 focused Node tests passed together: H4 PDF layout/search, H5 resource protections, M8 existing editor exports, and real OCR acceptance. Includes same-page native-text-plus-image preservation without duplicate native text.
- 10 Python resource/upload tests passed.
- `npm run ocr:provision`: all three model hashes verified.
- `npm run ocr:check`: real OCR initialization and English recognition passed with English/Hindi/Marathi loaded.
- Real HTTP extraction and Searchable PDF passed for scanned, digital and mixed-page PDFs. A real Hindi/Marathi raster fixture produced searchable `????` and `?????`. Tests also cover Unicode pixel invariance, all four rotations, crop offsets, blank pages, invalid geometry, missing data, cancellation, hard child timeout, memory rejection, upload cleanup, concurrency and rate limits.
- The large HTTP client boundary test runs in its own process to avoid retaining synthetic client buffers in the OCR server test baseline. Exactly 50 MiB accepted at the multipart upload boundary; 50 MiB + 1 byte rejected before processing. This test isolates transport and is not OCR capacity certification.
- Production frontend build passed; Vite reported its existing large-chunk warning.
- `git diff --check` passed.

### Large-file measurements

Run on Windows, Node 22.12.0, using actual local OCR. Values below are **sampled combined RSS**, not hard-cap measurements. Fixture generation runs separately from conversion.

| Synthetic fixture | Mode | Result | Sampled RSS | Time |
|---|---|---|---:|---:|
| 25 MiB single scan + opaque uncompressed stream | Searchable PDF | completed | 325.4 MiB | 1.62 s |
| 50 MiB single scan + opaque uncompressed stream | Searchable PDF | completed | 406.5 MiB | 1.59 s |
| 25 MiB same fixture | text extraction | completed | 272.7 MiB | 1.01 s |
| 50 MiB same fixture | text extraction | completed | 329.7 MiB | 1.00 s |
| 50 MiB, four high-entropy scanned pages | Searchable PDF | explicit 413 memory rejection | 422.5 MiB | 1.43 s |
| 50 MiB, four high-entropy scanned pages | text extraction | explicit 413 memory rejection | 420.6 MiB | 2.98 s |

The first fixture intentionally isolates file/parser/output cost and is not representative of a long photographic scan. The high-entropy scan demonstrates that a valid PDF below the upload boundary may require splitting. Overshoot above 420 MiB is expected with a sampled guard.

Reproduce with `node tests/make-large-ocr-fixtures.mjs <temporary-directory>`, then `node tests/measure-large-ocr.mjs <fixture.pdf>` (append `--text` for extraction). Focused suites: `node --test tests/h4-pdf.test.mjs tests/h5-resources.test.mjs tests/m8-exports.test.mjs tests/ocr-acceptance.test.mjs tests/ocr-upload-boundary.test.mjs`. Python: `python -m unittest discover -s tests -p h5_brain_test.py`.

## Production verification and remaining limitations

**50 MB upload is configured and locally boundary-tested. General 50 MB OCR support within Render's 512 MB instance is NOT certified.** This host has no installed Linux/WSL or Docker runtime. No Render account/runtime access was available, and no production language files, live environment overrides, proxy upload caps, Linux RSS enforcement, 512 MiB cgroup behavior or concurrent normal API traffic were inspected or tested. The Windows measurements cannot substitute for that acceptance run.

The repository's existing `render.yaml` describes Python and references a nonexistent `TNT-brain` directory; it does not provision the Node OCR API. It was not repurposed. `render.node.yaml` is a separate, unapplied Node blueprint showing the build checks and conservative limits. Configure the actual Node service's build to run `npm ci && npm run build`; preserve its existing secrets/environment, and remove stale OCR model path/size overrides. `GET /api/ocr/status` reports local file availability, selected languages and configured limits; it is not a recognition or memory certification endpoint.

Before releasing a 50 MB OCR claim, run these tests on an isolated Linux/Render instance with a real 512 MiB cgroup limit and normal API baseline, including sustained multipage scans, realistic compression, all requested languages and both endpoints. Inspect cgroup peak memory/OOM counters, latency, cleanup after kill/disconnect, and proxy timeouts. Heavy documents may continue to need splitting or a higher-memory/background worker. Existing native text is not proofread; overlap detection can need tuning for unusually rotated/overlapping native text, and arbitrary PDF layout/search behavior in all desktop viewers is not certified. OCR accuracy depends on scan quality.
