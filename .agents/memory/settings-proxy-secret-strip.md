---
name: External settings proxy secret leaks
description: Rule for any "settings live on external API, backend proxies them" codebase — credentials stored as settings fields must be stripped at every proxy egress point.
---

When the backend acts as a proxy to an external settings API (the TokShop/Seakana pattern), it is tempting to add new fields to the same settings document for convenience. If any of those fields is a credential (service-account JSON, private key, webhook secret, etc.), it can silently leak to the browser.

**Rule:** Maintain a single `SERVER_ONLY_FIELDS` allowlist and apply it at *every* endpoint that echoes settings back to a client. That includes:
- the public `/settings/keys`-style endpoint
- the admin `/settings/full` (GET) endpoint
- the admin `/settings` (POST) endpoint — the external API often echoes the saved object verbatim in its response

**Why:** A previous review caught a service-account JSON being returned via `/api/settings/full` because the field was added to the credential resolution path but the proxy still ran `unwrapApiResponse(data)` and returned the raw object. Stripping only at one endpoint is not enough — the POST echo path leaked it too.

**How to apply:** Before adding any new credential-bearing field to the external settings document, add its key to the strip list and grep every settings proxy handler to confirm the strip helper is applied to the outgoing payload.
