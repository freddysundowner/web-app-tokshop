---
name: Dev server does not watch server files
description: Why server-side route/logic changes don't take effect until a manual workflow restart
---

The `npm run dev` script runs `tsx server/index.ts` (no `watch` flag). Vite HMR
reloads only the **client** bundle. Express/server code changes (routes, proxy
targets, payload shapes in `shared-backend/server/**`) are NOT picked up by the
running process.

**Why:** Symptom is "you're still calling the old endpoint" even though the file
is correct — the client HMR'd to the new path but the server process is still
executing the previously-loaded route handler.

**How to apply:** After ANY edit under `shared-backend/server/**` (or other
server entry code), restart the `Start application` workflow before testing or
trusting logs. Confirm via logs that the new code path runs.
