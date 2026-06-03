// Country & currency model for the platform.
//
// There are two distinct concepts here, kept deliberately separate:
//
//  1. COUNTRY_CATALOG — the full set of countries the platform knows about and
//     the currency each one uses. This is the STATIC source for currency
//     lookups and the pool the admin picks the allowed list from. It never
//     changes at runtime.
//
//  2. The ALLOWED list — which countries buyers are actually restricted to.
//     This is DYNAMIC: it comes from the admin "Allowed Countries" setting
//     (stored on the external API). Helpers that decide "is this country
//     allowed?" take the resolved allowed codes as a parameter.
//
// Because listings are country-filtered, a buyer only ever sees sellers from
// their own country — so the viewer's currency is always the same as the
// listing's currency. No conversion is required.

export interface AllowedCountry {
  name: string;
  isoCode: string; // ISO 3166-1 alpha-2
  currency: string; // ISO 4217
  symbol: string;
}

// `null` means "no restriction — all countries are allowed".
// An array means "restrict to exactly these ISO codes".
export type AllowedCodes = string[] | null;

export const COUNTRY_CATALOG: AllowedCountry[] = [
  { name: "Ireland", isoCode: "IE", currency: "EUR", symbol: "€" },
  { name: "United Kingdom", isoCode: "GB", currency: "GBP", symbol: "£" },
  { name: "United States", isoCode: "US", currency: "USD", symbol: "$" },
  { name: "Germany", isoCode: "DE", currency: "EUR", symbol: "€" },
  { name: "France", isoCode: "FR", currency: "EUR", symbol: "€" },
  { name: "Spain", isoCode: "ES", currency: "EUR", symbol: "€" },
  { name: "Italy", isoCode: "IT", currency: "EUR", symbol: "€" },
  { name: "Netherlands", isoCode: "NL", currency: "EUR", symbol: "€" },
  { name: "Belgium", isoCode: "BE", currency: "EUR", symbol: "€" },
  { name: "Austria", isoCode: "AT", currency: "EUR", symbol: "€" },
  { name: "Portugal", isoCode: "PT", currency: "EUR", symbol: "€" },
  { name: "Finland", isoCode: "FI", currency: "EUR", symbol: "€" },
  { name: "Greece", isoCode: "GR", currency: "EUR", symbol: "€" },
  { name: "Canada", isoCode: "CA", currency: "CAD", symbol: "$" },
  { name: "Australia", isoCode: "AU", currency: "AUD", symbol: "$" },
  { name: "New Zealand", isoCode: "NZ", currency: "NZD", symbol: "$" },
  { name: "Switzerland", isoCode: "CH", currency: "CHF", symbol: "CHF" },
  { name: "Sweden", isoCode: "SE", currency: "SEK", symbol: "kr" },
  { name: "Norway", isoCode: "NO", currency: "NOK", symbol: "kr" },
  { name: "Denmark", isoCode: "DK", currency: "DKK", symbol: "kr" },
  { name: "Poland", isoCode: "PL", currency: "PLN", symbol: "zł" },
  { name: "Japan", isoCode: "JP", currency: "JPY", symbol: "¥" },
  { name: "China", isoCode: "CN", currency: "CNY", symbol: "¥" },
  { name: "India", isoCode: "IN", currency: "INR", symbol: "₹" },
  { name: "Brazil", isoCode: "BR", currency: "BRL", symbol: "R$" },
  { name: "Mexico", isoCode: "MX", currency: "MXN", symbol: "$" },
  { name: "South Africa", isoCode: "ZA", currency: "ZAR", symbol: "R" },
  { name: "United Arab Emirates", isoCode: "AE", currency: "AED", symbol: "AED" },
  { name: "Singapore", isoCode: "SG", currency: "SGD", symbol: "$" },
  { name: "Hong Kong", isoCode: "HK", currency: "HKD", symbol: "$" },
  { name: "South Korea", isoCode: "KR", currency: "KRW", symbol: "₩" },
];

// The built-in default allowed set. Used only when the admin has NEVER
// configured an allowed-countries list, so the platform behaves exactly as it
// historically did (locked to these four) until an admin changes it.
export const DEFAULT_ALLOWED_COUNTRY_CODES = ["IE", "GB", "US", "DE"];

export const DEFAULT_CURRENCY = "USD";

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  GBP: "£",
  USD: "$",
  CAD: "$",
  AUD: "$",
  NZD: "$",
  CHF: "CHF",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  BRL: "R$",
  MXN: "$",
  ZAR: "R",
  AED: "AED",
  SGD: "$",
  HKD: "$",
  KRW: "₩",
};

// Common alternate spellings/codes that should resolve to a canonical ISO code.
const CODE_ALIASES: Record<string, string> = {
  UK: "GB",
};

// Resolve any country name or code to the catalog entry, independent of whether
// it is currently allowed. This is the basis for currency lookups.
export function findCountryInCatalog(
  nameOrCode?: string | null,
): AllowedCountry | null {
  const value = (nameOrCode || "").trim();
  if (!value) return null;
  const upper = value.toUpperCase();
  const code = CODE_ALIASES[upper] || upper;
  return (
    COUNTRY_CATALOG.find((c) => c.isoCode === code) ||
    COUNTRY_CATALOG.find((c) => c.name.toLowerCase() === value.toLowerCase()) ||
    null
  );
}

function normalizeToCode(value: unknown): string | null {
  return findCountryInCatalog(typeof value === "string" ? value : "")?.isoCode ?? null;
}

// Turn the raw `allowed_countries` setting value into resolved allowed codes.
//  - undefined / null  → never configured → fall back to the default set
//  - empty array/string → no restriction (all countries) → null
//  - non-empty         → restrict to those (normalized) codes
// Accepts arrays, JSON-encoded arrays, or comma-separated strings for safety.
export function resolveAllowedCountryCodes(setting: unknown): AllowedCodes {
  if (setting === undefined || setting === null) {
    return [...DEFAULT_ALLOWED_COUNTRY_CODES];
  }

  let raw: unknown[] = [];
  if (Array.isArray(setting)) {
    raw = setting;
  } else if (typeof setting === "string") {
    const trimmed = setting.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      raw = Array.isArray(parsed) ? parsed : trimmed.split(",");
    } catch {
      raw = trimmed.split(",");
    }
  } else {
    return [...DEFAULT_ALLOWED_COUNTRY_CODES];
  }

  const codes: string[] = [];
  for (const item of raw) {
    const code = normalizeToCode(item);
    if (code && !codes.includes(code)) codes.push(code);
  }
  return codes.length === 0 ? null : codes;
}

// Combine the master country-filter switch with the allowed-countries list into
// a single source of truth used everywhere (server filter, gate, sign-up,
// client dropdowns):
//  - master switch OFF → null (no restriction anywhere; show all countries)
//  - master switch ON  → resolve the allowed list (default / all / subset)
export function computeEffectiveAllowedCodes(opts: {
  filterEnabled: boolean;
  allowedCountries: unknown;
}): AllowedCodes {
  if (!opts.filterEnabled) return null;
  return resolveAllowedCountryCodes(opts.allowedCountries);
}

// Return the catalog entries for the given allowed codes. `null`/`undefined`
// means "no restriction" and yields the whole catalog.
export function getAllowedCountries(
  allowedCodes?: AllowedCodes,
): AllowedCountry[] {
  if (allowedCodes === undefined || allowedCodes === null) return COUNTRY_CATALOG;
  return COUNTRY_CATALOG.filter((c) => allowedCodes.includes(c.isoCode));
}

// Resolve a country to a catalog entry, but only if it is allowed under the
// given codes. `null`/`undefined` codes means "no restriction" so any catalog
// country resolves.
export function findAllowedCountry(
  nameOrCode?: string | null,
  allowedCodes?: AllowedCodes,
): AllowedCountry | null {
  const country = findCountryInCatalog(nameOrCode);
  if (!country) return null;
  if (allowedCodes === undefined || allowedCodes === null) return country;
  return allowedCodes.includes(country.isoCode) ? country : null;
}

export function isAllowedCountry(
  nameOrCode?: string | null,
  allowedCodes?: AllowedCodes,
): boolean {
  return findAllowedCountry(nameOrCode, allowedCodes) !== null;
}

// Currency lookup always uses the full catalog so prices render correctly even
// when a country is later removed from the allowed list or filtering is off.
export function getCurrencyForCountry(nameOrCode?: string | null): string {
  return findCountryInCatalog(nameOrCode)?.currency || DEFAULT_CURRENCY;
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}
