---
name: Currency + country-lock safe foundation
description: Where the country allowlist must be enforced, and how viewer-local currency display works, for the TokShop marketplace
---

# Country allowlist + local-currency display

Single source of truth: `shared-backend/shared/currency.ts` (ALLOWED_COUNTRIES with
name/isoCode/currency/symbol; isAllowedCountry, getCurrencyForCountry, getCurrencySymbol;
matches by ISO code OR name, with UK→GB alias). Importable from server (`../../shared/currency`)
and client (`@shared/currency`).

## Rule: lock country at EVERY place it can be set
A country allowlist is only "safe" if enforced on all paths. Missing any one silently
lets unsupported countries through. The set of paths:
- Client dropdowns: `address-fields.tsx` (email signup), `auth/social-auth-complete-form.tsx`
  (social completion), `auth/country-required-gate.tsx` (post-signup gate). All three must
  render from the shared allowlist (ALLOWED_COUNTRY_CODES / ALLOWED_COUNTRY_NAMES), never the
  full COUNTRIES list.
- Server (`shared-backend/server/routes/auth.ts`): email signup, `/api/auth/social`,
  `/api/auth/social/complete`, AND `PATCH /api/users/profile`. Each must `isAllowedCountry(...)`
  before proxying to the external API.
**Why:** an architect review caught social-complete dropdown + `/api/auth/social` route +
`/api/users/profile` countryCode field all bypassing the lock after the "obvious" signup path
was fixed.
**How to apply:** check BOTH `country` and `countryCode` fields where present. On `/api/auth/social`
only reject when a country value is actually supplied (`country && !isAllowedCountry(country)`) —
returning sign-ins omit country and the backend resolves the existing user; blocking empty would
break login.

## Rule: display prices in the viewer's local currency
No FX conversion — the country filter guarantees same-country buyer/seller, so viewer currency ==
listing currency. Use `useCurrency()` (`marketplace-app/client/src/lib/use-currency.ts`) →
`{ currency, symbol, format }`. Replace hardcoded `$`, `.toFixed(2)` money displays, `$`
input-prefix spans, `Price ($)` labels, fixed-amount discount toggles (`'%' : '$'`), and even SVG
`<text>$</text>` glyphs with `format(amount)` or the `symbol`.
**Collision:** files importing date-fns `format` MUST alias the hook formatter:
`const { format: formatPrice } = useCurrency()`. Otherwise the currency formatter shadows date-fns.
**Out of scope (do NOT touch):** Stripe checkout charge currency, and static payment-processing fee
copy like "2.9% + $0.30" (the real fee/symbol varies by region; changing only the symbol misleads).

## Rule: the country gate must NOT depend on the admin country_filter_enabled flag
The post-login `CountryRequiredGate` (App.tsx) must fire for ANY authenticated user whose
`country` is empty, unconditionally. It was previously gated behind the admin setting
`country_filter_enabled`, which was off by default — so Gmail/social signups (which skip the
completion form unless the backend returns `newuser === true`) slipped in with no country.
**Why:** a no-country user makes `useCurrency()` fall back to USD ($), and the whole feature
requires every user to be in one of the 4 supported countries. Symptom reported: "registered via
Gmail, never asked for country" + "$ shows in add-product even when country is different."
**How to apply:** `mustResolveCountry = isAuthenticated && !userHasCountry` alone should trigger
the gate. Don't reintroduce a settings/flag dependency in front of it.

## Verification note
Marketplace `npx tsc -p marketplace-app/tsconfig.json --noEmit` has a large PRE-EXISTING baseline
(~103 errors: react-hook-form `Control<>` generic mismatches, product data-shape gaps, standalone
`Session.user` augmentation). Currency work added zero. Confirm by grepping tsc output for
`symbol|currency|isAllowedCountry|ALLOWED_COUNTRY` — path matches (e.g. "inventory") are not real
currency errors.
