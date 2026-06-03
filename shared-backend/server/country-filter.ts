import type { Request } from "express";
import fetch from "node-fetch";
import { BASE_URL, getAccessToken, unwrapApiResponse } from "./utils";

let cached: { enabled: boolean; at: number } | null = null;
const TTL_MS = 60_000;

export function invalidateCountryFilterCache() {
  cached = null;
}

async function fetchEnabledFromSettings(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/settings`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return false;
    const json: any = await res.json();
    // The external /settings endpoint returns an array ([{...}]) or a wrapped
    // { success, data } object — unwrap to the actual settings record.
    const data = unwrapApiResponse(json);
    return Boolean(data?.country_filter_enabled);
  } catch {
    return false;
  }
}

async function getCountryFilterEnabled(req: Request): Promise<boolean> {
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) return cached.enabled;
  const token = getAccessToken(req);
  if (!token) return cached?.enabled ?? false;
  const enabled = await fetchEnabledFromSettings(token);
  cached = { enabled, at: now };
  return enabled;
}

export function getUserCountry(req: Request): string | null {
  const user = (req.session as any)?.user;
  const c = user?.country;
  return typeof c === "string" && c.trim() ? c.trim() : null;
}

// The value sent in the `country` query param: prefer the user's ISO country
// code (e.g. "US"), falling back to the full country name when no code is on
// file (e.g. legacy accounts that only stored the name).
export function getUserCountryValue(req: Request): string | null {
  const user = (req.session as any)?.user;
  const code = user?.countryCode;
  if (typeof code === "string" && code.trim()) return code.trim();
  return getUserCountry(req);
}

export async function applyCountryFilter(
  req: Request,
  params: URLSearchParams,
): Promise<void> {
  const country = getUserCountryValue(req);
  const enabled = await getCountryFilterEnabled(req);
  if (!enabled) return;
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
  const country = getUserCountryValue(req);
  const enabled = await getCountryFilterEnabled(req);
  if (!enabled) return;
  // Hard filter: strip any client-supplied country part first.
  for (let i = queryParts.length - 1; i >= 0; i--) {
    if (queryParts[i].startsWith("country=")) queryParts.splice(i, 1);
  }
  if (country) queryParts.push(`country=${encodeURIComponent(country)}`);
}
