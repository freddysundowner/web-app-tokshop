---
name: Country filter forwards empty for social-signup accounts
description: Why the marketplace country query filter sends an empty/absent country for some logged-in users despite the filter working correctly.
---

The marketplace country filter forwards the session user's `country` (top-level field on the external `/users/:id` record) to listing endpoints when the external `country_filter_enabled` setting is true. The server hard-strips any client-supplied `country` and only re-adds the server-side value, so URL override is not possible.

When the filter appears to "send empty country", the usual cause is **data, not code**: the user's record has `country: ""` and no `countryCode` anywhere (and the address object carries no country either). This happens for accounts created via **Apple/social signup**, which never captures a country at signup. Email signup has a country field and does populate it.

**Why:** confirmed by probing the live `/users/:id` payload — for an Apple account the only country-related field present was top-level `country: ""`; there was no `countryCode` and the `address` object had no country. So `getUserCountry` correctly returns null and nothing is forwarded.

**How to apply:** before "fixing" the filter logic, verify whether the test account actually has a country stored. The fix for missing country is on the data side (capture & persist country during social-auth completion / profile edit), not in `country-filter.ts`. Do not blindly fall back to `address.countryCode` — top-level `country` is likely a full name while address uses ISO codes (e.g. "GB"), and the external API match format is unconfirmed; mixing formats would silently mis-filter.

Secondary risk noted: `getCountryFilterEnabled` fails open (returns false) on a `/settings` fetch error, disabling filtering for the 60s TTL window. Make it fail-closed / keep last-known-good if country filtering is ever policy-critical.

## External /settings returns an array
The external `${BASE_URL}/settings` endpoint returns a JSON **array** (`[{...}]`), not an object — sometimes also a `{success, data}` wrapper. Always normalize with `unwrapApiResponse()` (utils.ts: takes `array[0]`, unwraps `{success,data}`) before reading any settings field such as `country_filter_enabled`. Reading the field directly off the raw response yields `undefined` and silently disables the feature.

## Filter param value: ISO code, fallback to name (user decision)
Decision (user-chosen): the `country` query param sent to the external API carries the **ISO country code** (e.g. `country=US`), not the full name. `getUserCountryValue()` in `country-filter.ts` prefers `session.user.countryCode` and falls back to `session.user.country` (full name) for legacy accounts that have no code on file. The param NAME stays `country` — the user explicitly chose "keep the existing param, put the code as its value" over a new `countryCode` param.

Registration now persists BOTH: email signup forwards `country` (name) + `countryCode` (ISO, from the selected country's `isoCode`/`iso2`) to `${BASE_URL}/auth/signup`. `signupSchema` must include `countryCode` (optional) or zod strips it before the proxy forwards. `countryCode` is also threaded through every marketplace auth user mapping (email login, social login/existing-user, social-complete, localStorage restore) so `x-user-data` carries it into the session for the filter.

**Why:** products are matched by ISO code on the external side; sending the full name was returning fewer/no matches. The earlier "mixing formats" warning above is resolved by this decision — code is canonical, name is only a legacy fallback.
