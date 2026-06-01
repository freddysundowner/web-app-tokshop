import type { Request } from "express";
import fetch from "node-fetch";
import { BASE_URL, getAccessToken } from "./utils";

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
    const data = json?.data || json;
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

export async function applyCountryFilter(
  _req: Request,
  params: URLSearchParams,
): Promise<void> {
  // Country filtering is disabled: never forward a country to the external API.
  // Strip any client-supplied country so no endpoint queries by country.
  params.delete("country");
}

export async function appendCountryFilterToParts(
  _req: Request,
  queryParts: string[],
): Promise<void> {
  // Country filtering is disabled: never forward a country to the external API.
  // Strip any client-supplied country part so no endpoint queries by country.
  for (let i = queryParts.length - 1; i >= 0; i--) {
    if (queryParts[i].startsWith("country=")) queryParts.splice(i, 1);
  }
}
