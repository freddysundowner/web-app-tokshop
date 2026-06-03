---
name: Country-required gate + configurable allowed-countries policy
description: How the country gate/filter works, the configurable allowed list, and why the policy must be fetched token-independently.
---

The country policy has two parts on the external settings record: `country_filter_enabled` (master switch) and `allowed_countries` (admin-editable list). Effective semantics (see `computeEffectiveAllowedCodes`/`resolveAllowedCountryCodes` in `@shared/currency`):
- filter disabled → no restriction (show all countries, no gate).
- enabled + list ABSENT → default to 4 codes (IE, GB, US, DE).
- enabled + list EMPTY → no restriction (show all countries, no gate, country optional).
- enabled + list NON-EMPTY → restrict to those ISO codes.

`null` effective codes everywhere means "no restriction". The marketplace client reads the effective list from `/api/settings` as `allowed_countries` (array | null).

**The gate's "has country" test MUST use the SAME allowlist resolver as the server filter, not "any non-empty string".** Gate computes `userHasCountry = allowedCodes===null || isAllowedCountry(countryCode, allowedCodes) || isAllowedCountry(country, allowedCodes)`, mirroring the server's `findAllowedCountry(code) || findAllowedCountry(name)`. Check code and name *independently* — `isAllowedCountry(code || name)` short-circuits and wrongly blocks a user with an invalid code but a valid country name.

**Why:** An account can have a non-empty but UNSUPPORTED country value. "Any non-empty" passes the gate, but the server filter can't resolve it → it omits the `country` param → the user silently sees ALL countries' content.

**The country policy is PUBLIC config — resolve it token-independently on the server.**
**Why:** The external FULL `/settings` is auth-gated (401 without a token), but the policy fields (`country_filter_enabled` + `allowed_countries`) are also published on the PUBLIC `/settings/keys`. The server-side filter cache (`country-filter.ts`) previously fetched the auth-gated `/settings` with a user token and returned "no restriction" when absent. Unauthenticated flows (sign-up, social-auth verify/complete) then silently SKIPPED the country allowlist — a broken-access-control bypass. The fetch now reads the PUBLIC `/settings/keys` (no token) and falls back to last-known-good cache on transient failure. See `settings-public-policy.md`.
**How to apply:** Any code enforcing the allowlist (sign-up validation, listing filter) must go through `getEffectiveAllowedCodes(req)`; never gate the policy fetch on the requester's token. Resolve with `computeEffectiveAllowedCodes` on every path (public proxy, server filter, authenticated `/api/settings`) so they never diverge.

**How to apply (gate/UX):**
- Gate decision waits for `settingsFetched` (from settings-context). Before settings load, `settings.allowed_countries` is undefined → looks like "no restriction"; gating on `settingsFetched` avoids a false skip/wrong decision. App.tsx also calls `fetchSettings()` on auth.
- Router decides gating from `currentUser = freshUserData || user`, where `freshUserData` is the cached `['/api/profile/${userId}']` query. **That cached profile wins over the auth `user` object.** Any mutation of a gated field (country) MUST update/invalidate that profile cache or the gate never dismisses (`auth-context.updateCountry` does `setQueriesData` + `invalidateQueries` on `/api/profile/` keys).
- Country dropdowns (gate, social-auth-complete form, address-fields) render `getAllowedCountries(allowedCodes)` — the full catalog when unrestricted, else only allowed countries. Stored country value is the full name (e.g. "United Kingdom"); the catalog lives in `@shared/currency` (`COUNTRY_CATALOG`).
- Admin Settings picker prefills the default 4 when the stored list is absent (avoids accidentally saving `[]` = "all"); "Clear (allow all)" sets `[]` intentionally.
