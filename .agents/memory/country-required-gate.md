---
name: Country-required gate (marketplace)
description: How the mandatory country gate works and the cache pitfall when mutating gated user fields.
---

When the external settings flag `country_filter_enabled` is true, every authenticated marketplace user must have a non-empty `country`. The marketplace router (`App.tsx`) renders a non-bypassable `CountryRequiredGate` before any route when `isAuthenticated && countryFilterEnabled && !userHasCountry`. This covers existing social-signup accounts (Apple/Google) that never captured a country, not just new signups.

**Why:** Social signup historically never captured a country, leaving `user.country = ""`, which silently broke the country filter forwarding.

**The gate's "has country" test MUST use the SAME supported-country resolver as the server filter, not "any non-empty string".** The gate computes `userHasCountry = isAllowedCountry(countryCode) || isAllowedCountry(country)` (from `@shared/currency`), mirroring the server's `getUserAllowedCountry` = `findAllowedCountry(code) || findAllowedCountry(name)`. Check code and name *independently* — `isAllowedCountry(code || name)` short-circuits and wrongly blocks a user with an invalid code but a valid country name.

**Why:** An account (e.g. Google signup id 6a1414a7…) can have a non-empty but UNSUPPORTED/unrecognized country value. "Any non-empty" passes the gate, but the server filter can't resolve it → it omits the `country` param → the user silently sees ALL countries' content. Aligning both checks on the allowlist forces such users through the gate; once they pick a supported country, requests carry `country=XX` and filtering works (confirmed in logs).

**How to apply:**
- The flag reaches the client via `/api/settings` (`country_filter_enabled` boolean). The route is auth-gated (401 without token), so only authenticated requests see it.
- The router decides gating from `currentUser = freshUserData || user`, where `freshUserData` is the cached `['/api/profile/${userId}']` query. **This cached profile wins over the auth `user` object.** Any mutation that changes a gated field (like country) MUST also update/invalidate that profile query cache, or the gate never dismisses even after a successful save. `auth-context.updateCountry` does `setQueriesData` + `invalidateQueries` on keys starting with `/api/profile/`.
- Fail-closed on load: while `/api/settings` is still loading for a no-country user, the router holds a loader instead of rendering routes, so the user can't slip past before the flag resolves.
- Country values are full names (e.g. "United Kingdom"), sourced from `lib/countries.ts` (shared by the gate and the social-auth-complete form).
