// Single source of truth for the countries allowed on the platform and the
// currency each one uses. Because listings are country-filtered, a buyer only
// ever sees sellers from their own country — so the viewer's currency is always
// the same as the listing's currency. No conversion is required.

export interface AllowedCountry {
  name: string;
  isoCode: string; // ISO 3166-1 alpha-2
  currency: string; // ISO 4217
  symbol: string;
}

export const ALLOWED_COUNTRIES: AllowedCountry[] = [
  { name: "Ireland", isoCode: "IE", currency: "EUR", symbol: "€" },
  { name: "United Kingdom", isoCode: "GB", currency: "GBP", symbol: "£" },
  { name: "United States", isoCode: "US", currency: "USD", symbol: "$" },
  { name: "Germany", isoCode: "DE", currency: "EUR", symbol: "€" },
];

export const ALLOWED_COUNTRY_CODES = ALLOWED_COUNTRIES.map((c) => c.isoCode);
export const ALLOWED_COUNTRY_NAMES = ALLOWED_COUNTRIES.map((c) => c.name);

export const DEFAULT_CURRENCY = "USD";

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  GBP: "£",
  USD: "$",
};

// Common alternate spellings/codes that should resolve to a canonical ISO code.
const CODE_ALIASES: Record<string, string> = {
  UK: "GB",
};

export function findAllowedCountry(
  nameOrCode?: string | null,
): AllowedCountry | null {
  const value = (nameOrCode || "").trim();
  if (!value) return null;
  const upper = value.toUpperCase();
  const code = CODE_ALIASES[upper] || upper;
  return (
    ALLOWED_COUNTRIES.find((c) => c.isoCode === code) ||
    ALLOWED_COUNTRIES.find(
      (c) => c.name.toLowerCase() === value.toLowerCase(),
    ) ||
    null
  );
}

export function isAllowedCountry(nameOrCode?: string | null): boolean {
  return findAllowedCountry(nameOrCode) !== null;
}

export function getCurrencyForCountry(nameOrCode?: string | null): string {
  return findAllowedCountry(nameOrCode)?.currency || DEFAULT_CURRENCY;
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}
