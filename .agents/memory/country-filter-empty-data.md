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
