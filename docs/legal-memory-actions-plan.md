# Temporary GitHub Actions memory test — approval package

Repository: samiksha3002/Talkntypeai
Local branch: test/legal-ai-memory-20261114
Local directory: C:\Users\hp\Talkntypeai-legal-memory-ci
Base: d518052. No push, workflow run, PR, merge or deployment has occurred.

Only the restoration candidate's four Python files are copied into this test branch, byte-for-byte, including concurrency=1 and the 8-million-pixel page limit. Node/frontend restoration changes stay in their original worktree and are not needed to measure Python memory.

The workflow `.github/workflows/legal-ai-memory.yml` triggers only on this exact test branch; no main/PR/scheduled trigger. The job runs Ubuntu 24.04, has contents:read only, persists no checkout credential, references no secrets or production environment, and has a 30-minute deadline. It builds the disposable image then runs one Python application worker with Docker memory=512m, memory-swap=512m (zero additional swap), one CPU, private cgroup namespace and network=none. Only synthetic PDFs and backend test credentials are used. OpenAI-compatible responses are provided inside the container over loopback; actual PDF/OCR processing, SDK serialization, in-memory embeddings and persisted Chroma corpus retrieval execute.

The approved 6,804-chunk corpus is queried and retained before PDF flows begin. The test covers 60-page text PDFs and 25-page scanned PDFs near the 8-million-pixel boundary, two synthetic owners, PDF analysis/chat/PDF-assisted drafts and typed-facts drafts (14 flows). The host independently samples cgroup memory.peak and OOM counters, retaining evidence if the worker/container is killed. Result: PASS/FAIL, peak MiB, headroom, hard-cap verification, corpus count, completion counts, OOM state, exact dependency versions and logs. Artifacts expire after three days. No image is pushed to a registry.

PASS requires all flows, 6,804 corpus chunks, actual reference retrieval, zero OOM kills, verified 512 MiB/zero-swap isolation and peak =448 MiB (64 MiB safety headroom). A build failure, missing measurement, incomplete flow or higher peak is FAIL; missing evidence cannot become PASS. This is memory acceptance with synthetic provider responses, not validation of live provider credentials or legal output quality.

Deployment suppression for this test branch only:
* vercel.json sets git.deploymentEnabled["test/legal-ai-memory-20261114"]=false. Existing rewrites are unchanged. This guard is not intended for merge into the application release.
* The local commit message includes [skip render], Render's documented per-commit auto-deploy skip phrase. No PR is opened, so no Render PR preview is requested.
* No deploy token, deploy action, service settings change, production request, Render shell or database operation occurs.

Official behavior references:
https://vercel.com/docs/project-configuration/git-configuration
https://render.com/docs/deploys#skipping-an-auto-deploy

Local verification completed: workflow YAML parsed; exact branch/Ubuntu/read-only/no-secrets configuration checked; Python syntax passed; seven PASS/FAIL decision cases passed, including OOM, missing evidence, missing cap verification and timeout; branch deployment guard validated; Git whitespace check passed. The Linux/Docker workload itself has not run locally; Docker and WSL were not installed.

Approval requested: push only this new test branch (ordinary non-force push), triggering its isolated GitHub Actions test; read the run logs/artifact and report measured PASS/FAIL and peak. Do not push main, create a PR, merge, deploy, or modify production. The request for approval comes directly from the user's instruction to ask before pushing a test branch.
