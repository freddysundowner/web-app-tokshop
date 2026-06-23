---
name: Favicon driven by app settings
description: How the browser favicon is sourced in admin-app and marketplace-app
---

The favicon is NOT just a static asset. Both apps update `<link rel="icon">` at
runtime from the admin-configured app logo.

**Rule:** favicon comes from the `app_logo` theme field (served by the external API
under `/uploads/...`), resolved to an absolute URL via `getImageUrl(logo, externalApiUrl)`.
A `useFavicon` hook in each app's `Router()` (next to `usePageTitle()`) performs the swap.
A static `client/public/favicon.png` exists in each app only as the pre-JS fallback.

**Why:** request was "make admin settings have favicon icon" — the icon must reflect
whatever logo the admin sets, so it can't be a hardcoded file. Marketplace reads
`theme.app_logo` (falls back to header/landing logos); admin reads `settings.app_logo`
which had to be added to AppSettings and captured from the `/themes` fetch (admin's
settings-context previously only pulled app_name/colors from themes).

**How to apply:** if the favicon looks wrong/stale, check (1) `/themes` (or
`/api/public/themes`) actually returns `app_logo`, and (2) `/api/config` returns
`externalApiUrl`. If either is empty the hook no-ops and the static fallback shows.
