---
name: Firebase Admin credential resolution
description: Why the Firebase Admin service-account JSON cannot live only on the external settings API, and the resolution order to use.
---

The Firebase Admin SDK credential (service-account JSON) must be resolvable on every cold start *without* an authenticated request, because the SDK is initialized lazily from request handlers that don't carry admin auth.

**Why:** The external settings API (`BASE_URL/settings`) returns 401 unauthenticated, and even when authenticated it should not expose the privileged service-account field to most callers. Relying on it as the credential source means a server restart leaves the Admin SDK without credentials until an admin happens to upload again — silently breaking Storage writes / custom-token minting for everyone in between.

**How to apply:** Resolve credentials in this order on every init — env var → local gitignored disk file → settings fetch (best-effort, may fail). When admins upload a new service account, persist to both the env var (immediate) and the disk file (survives restart). External-settings sync is best-effort/non-fatal; the local copy is the source of truth the SDK actually loads. The disk file path must be gitignored.
