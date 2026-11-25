# Scoped 512 MiB memory amendment — 14 November 2026

Status: **HOLD — Linux memory acceptance not executed.** No current Linux peak is available, and this is not a claim that the revised candidate exceeds 512 MiB.

Applied only the requested production changes:

* `routes/legalWorkspace.js`: workspace concurrency 2 ? 1.
* `TNT_BRAIN/workspace_boundary.py`: workspace concurrency 2 ? 1.
* `TNT_BRAIN/workspace_routes.py`: per-page raster allowance 40,000,000 ? 8,000,000 pixels, using the existing 200-DPI calculation.

All other limits and production files retain the existing restoration candidate contents. In particular, total raster allowance, authentication, account/subscription checks, customer-isolation design, Admin Panel and existing workflows were not modified by this amendment.

Focused verification: 10 Python workspace tests PASS (including two-user isolation, one-slot admission/retry, below/above 8-million-pixel rejection, cleanup, containment, authentication and input limits); 4 Node gateway tests PASS; 9 browser ? Node ? Python scenarios PASS. These use synthetic providers/repositories and do not measure Linux memory. Syntax and Git whitespace checks pass.

Exact execution blocker: Docker/Podman commands are unavailable and no installation was found at their standard checked locations; `wsl --list --quiet` explicitly reports that Windows Subsystem for Linux is not installed. No approved isolated remote Linux host was provided. No host feature installation, production shell access, deployment or remote upload was attempted. The user was asked asynchronously for an existing isolated Linux target.

The earlier 519.3 MiB Windows peak was for the OLD concurrency/raster settings. It must not be reported as a measurement of this revised candidate. Windows application control also prevented opening native Chroma in the prior local profiling attempt. Neither issue is bypassed or treated as Linux evidence.

Prepared Linux-only artifacts:

* `tests/legal-memory.Dockerfile`: Python 3.11 image installing the project's existing requirements. Copies Python code and the approved reference corpus only; no `.env`, account files, uploaded documents or old customer indexes.
* `tests/legal-memory-linux.py`: refuses execution unless Linux cgroup v2 reports exactly 536870912 bytes of memory and zero swap. Starts a single Uvicorn worker with real OpenAI SDK serialization, request-local PDF parsing/OCR/embeddings and actual Chroma reference retrieval. Synthetic provider responses run over loopback inside the same memory cgroup; no production key or external network is needed. This checks memory behavior, not real model output quality.

The harness covers 60-page text PDFs, 25-page scanned PDFs near the new raster boundary, analysis/chat/PDF-assisted drafting and typed-facts drafting for two synthetic owners: 14 flows, at least 150 OCR calls, six completed draft streams, and the 6,804-chunk corpus. It records cgroup peak, limit, swap, OOM kills, worker PID, provider-call counts and installed dependency versions. All driver/provider/worker overhead is inside the same cap. The reference store can be opened/migrated only inside the disposable test container. No host corpus is mounted or changed.

Run from the existing restoration worktree on an approved isolated Docker/Linux host:

```sh
docker build --file tests/legal-memory.Dockerfile --tag tnt-legal-memory .
docker run --rm --memory=512m --memory-swap=512m --cpus=1 --network=none tnt-legal-memory
```

These commands are prepared, **not executed**. The harness has passed syntax checks and correctly refuses Windows execution. It has not been runtime-validated on Linux. Successful acceptance requires all flows, corpus retrieval, zero OOM kills and at least 64 MiB headroom (peak =448 MiB); merely avoiding an OOM at 511 MiB is not accepted as safe headroom.

Smallest remaining action: run this disposable Linux test on an available isolated host and capture its JSON result. No additional application change or memory upgrade is justified without that measurement. If it fails, use the actual cgroup peak/OOM evidence to select the smallest next change.

After a verified pass and separate release approval: retain the existing planned Python ? Node ? frontend rollout, use one Python worker, configure matching backend-only `LEGAL_AI_SERVICE_KEY` on Python/Node and `LEGAL_AI_SERVICE_URL` on Node, retain existing provider/account/database settings and frontend `VITE_DRAFT_API_URL`. No database migration or changes to Admin recovery are required. Do not deploy while this memory gate is unresolved.
