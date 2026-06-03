import type { Request } from "express";
import fetch from "node-fetch";
import { BASE_URL, unwrapApiResponse } from "./utils";
import {
  computeEffectiveAllowedCodes,
  findAllowedCountry,
  type AllowedCodes,
} from "../shared/currency";

interface CachedSettings {
  enabled: boolean;
  allowedCodes: AllowedCodes; // effective restriction (null = show all)
  at: number;
}

let cached: CachedSettings | null = null;
const TTL_MS = 60_000;

export function invalidateCountryFilterCache() {
  cached = null;
}

// Fetch the country policy from the external settings endpoint. Returns `null`
// on any failure so the caller can fall back to last-known-good state instead
// of silently treating an outage as "no restriction".
// The country policy (allowed_countries) is PUBLIC configuration — the external
// /settings/keys endpoint serves it without auth — so we read it from there and
// must NOT require a user token. Gating this on a token would silently skip the
// restriction for unauthenticated flows (e.g. sign-up), which is exactly where
// the country allowlist must be enforced. The full /settings endpoint is
// auth-gated and would 401 for anonymous sign-up requests.
// /settings/keys publishes both `country_filter_enabled` and `allowed_countries`,
// so we resolve them EXACTLY like the authenticated /api/settings path
// (computeEffectiveAllowedCodes) to guarantee the two never diverge.
async function fetchSettings(): Promise<{
  enabled: boolean;
  allowedCodes: AllowedCodes;
} | null> {
  try {
    const res = await fetch(`${BASE_URL}/settings/keys`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    // The external endpoint returns an array ([{...}]) or a wrapped
    // { success, data } object — unwrap to the actual settings record.
    const data = unwrapApiResponse(json);
    const allowedCodes = computeEffectiveAllowedCodes({
      filterEnabled: Boolean(data?.country_filter_enabled),
      allowedCountries: data?.allowed_countries,
    });
    return {
      // A restriction is in effect only when an effective list is resolved.
      // (master switch off, or enabled+empty → null → show all.)
      enabled: allowedCodes !== null,
      allowedCodes,
    };
  } catch {
    return null;
  }
}

async function getSettings(
  req: Request,
): Promise<{ enabled: boolean; allowedCodes: AllowedCodes }> {
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) {
    return { enabled: cached.enabled, allowedCodes: cached.allowedCodes };
  }
  const fetched = await fetchSettings();
  if (fetched) {
    cached = { ...fetched, at: now };
    return fetched;
  }
  // Fetch failed — prefer the last-known-good policy (even if stale) over
  // failing open, so a transient external outage can't drop the restriction.
  if (cached) {
    return { enabled: cached.enabled, allowedCodes: cached.allowedCodes };
  }
  return { enabled: false, allowedCodes: null };
}

// The effective allowed-country restriction in play for this request. `null`
// means no restriction (show all countries). Exposed so other modules (e.g.
// sign-up validation) share the exact same resolution as the listing filter.
export async function getEffectiveAllowedCodes(
  req: Request,
): Promise<AllowedCodes> {
  return (await getSettings(req)).allowedCodes;
}

export function getUserCountry(req: Request): string | null {
  const user = (req.session as any)?.user;
  const c = user?.country;
  return typeof c === "string" && c.trim() ? c.trim() : null;
}

// The value sent in the `country` query param: always an ISO country code
// (e.g. "DE"). The external API expects the code, so we normalize whatever the
// account has on file — a stored countryCode, or the full country name (legacy
// / social-signup accounts that only stored the name) — to the canonical code.
// Restricted to the active allowed list so an out-of-list value can't slip
// through as a filter param.
export function getUserAllowedCountry(req: Request, allowedCodes: AllowedCodes) {
  const user = (req.session as any)?.user;
  const code = typeof user?.countryCode === "string" ? user.countryCode.trim() : "";
  const name = getUserCountry(req);
  // Resolve to a canonical allowed country (handles "Germany" -> DE, "UK" ->
  // GB, etc.). Try the stored code first, then the country name — independently,
  // so an invalid/unsupported code (e.g. "FR") still falls back to a valid name.
  return (
    findAllowedCountry(code, allowedCodes) || findAllowedCountry(name, allowedCodes)
  );
}

export function getUserCountryValue(
  req: Request,
  allowedCodes: AllowedCodes,
): string | null {
  // The value sent in the `country` query param is always a supported ISO code
  // (or null so no unsupported value is forced onto the external API filter).
  return getUserAllowedCountry(req, allowedCodes)?.isoCode ?? null;
}

export async function applyCountryFilter(
  req: Request,
  params: URLSearchParams,
): Promise<void> {
  const { enabled, allowedCodes } = await getSettings(req);
  // Master switch off, or no restriction configured (empty allowed list) —
  // show everything.
  if (!enabled || allowedCodes === null) return;
  const country = getUserCountryValue(req, allowedCodes);
  // Hard filter: strip any client-supplied country, then force the
  // session user's country. If the user has no country on file, drop any
  // client-supplied value so they cannot bypass via the URL.
  params.delete("country");
  if (country) params.set("country", country);
}

export async function appendCountryFilterToParts(
  req: Request,
  queryParts: string[],
): Promise<void> {
  const { enabled, allowedCodes } = await getSettings(req);
  if (!enabled || allowedCodes === null) return;
  const country = getUserCountryValue(req, allowedCodes);
  // Hard filter: strip any client-supplied country part first.
  for (let i = queryParts.length - 1; i >= 0; i--) {
    if (queryParts[i].startsWith("country=")) queryParts.splice(i, 1);
  }
  if (country) queryParts.push(`country=${encodeURIComponent(country)}`);
}
