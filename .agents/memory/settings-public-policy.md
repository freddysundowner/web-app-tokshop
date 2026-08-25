---
name: Public country policy via /settings/keys
description: Where the unauthenticated country allowlist policy actually comes from, and why /settings is not it.
---

The external API gates the FULL `/settings` behind auth — `GET https://api.seakana.com/settings` returns HTTP 401 without a token. Only `/settings/keys` and `/themes` are public.

The country allowlist policy is served on the PUBLIC `/settings/keys` endpoint (firebase keys + login flags + `allowed_countries` + `country_filter_enabled`). That endpoint exposes BOTH raw fields, so it can be resolved with the same logic as the authenticated path.

**Why:** Unauthenticated sign-up / social-auth flows need the policy before a token exists. Reading it from the auth-gated `/settings` would 401 and silently drop the restriction (a bypass). So both the server enforcement and the client read it from `/settings/keys`.

**How to apply:**
- Resolve the effective list with `computeEffectiveAllowedCodes({ filterEnabled: Boolean(country_filter_enabled), allowedCountries: allowed_countries })` EVERYWHERE — server enforcement (`country-filter.ts`), the public proxy `/api/settings/keys`, and the authenticated `/api/settings`. Using one resolver guarantees the public and authenticated paths never diverge.
- Effective semantics: switch off OR enabled+empty → null (no restriction, show all); enabled+non-empty → resolved list; enabled+absent → default 4 (IE,GB,US,DE).
- A restriction is active iff the resolved list is non-null (`enabled: allowedCodes !== null`).
- Client `settings-context` fetches `/api/settings/keys` on mount and sets a `policyLoaded` flag; pre-login pickers/gates key off `settingsFetched || policyLoaded`.
- A 401/404 from optional `/api/settings` must never clear user auth or redirect to login. Some environments reject regular user tokens there even immediately after successful authentication; keep current/public settings instead.
- Accepted tradeoff: if `/settings/keys` is unreachable on cold start with an empty cache, no restriction is applied (fail-open). Self-corrects via last-known-good cache + the post-login gate; the same endpoint powers Firebase config so an outage breaks sign-up anyway.
