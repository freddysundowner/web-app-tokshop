---
name: Country-required gate (marketplace)
description: How the mandatory country gate works and the cache pitfall when mutating gated user fields.
---

When the external settings flag `country_filter_enabled` is true, every authenticated marketplace user must have a non-empty `country`. The marketplace router (`App.tsx`) renders a non-bypassable `CountryRequiredGate` before any route when `isAuthenticated && countryFilterEnabled && !userHasCountry`. This covers existing social-signup accounts (Apple/Google) that never captured a country, not just new signups.

**Why:** Social signup historically never captured a country, leaving `user.country = ""`, which silently broke the country filter forwarding.

**How to apply:**
- The flag reaches the client via `/api/settings` (`country_filter_enabled` boolean). The route is auth-gated (401 without token), so only authenticated requests see it.
- The router decides gating from `currentUser = freshUserData || user`, where `freshUserData` is the cached `['/api/profile/${userId}']` query. **This cached profile wins over the auth `user` object.** Any mutation that changes a gated field (like country) MUST also update/invalidate that profile query cache, or the gate never dismisses even after a successful save. `auth-context.updateCountry` does `setQueriesData` + `invalidateQueries` on keys starting with `/api/profile/`.
- Fail-closed on load: while `/api/settings` is still loading for a no-country user, the router holds a loader instead of rendering routes, so the user can't slip past before the flag resolves.
- Country values are full names (e.g. "United Kingdom"), sourced from `lib/countries.ts` (shared by the gate and the social-auth-complete form).
