import { useAuth } from "./auth-context";
import { getCurrencyForCountry, getCurrencySymbol } from "@shared/currency";
import { formatCurrency } from "@shared/pricing";

// Returns the currency the current viewer should see prices in. Because
// listings are country-filtered, the viewer is always in the same country as
// the seller, so the viewer's currency matches the listing's currency.
export function useCurrency() {
  const { user } = useAuth();
  const currency = getCurrencyForCountry(user?.countryCode || user?.country);
  const symbol = getCurrencySymbol(currency);
  return {
    currency,
    symbol,
    format: (amount: number | null | undefined) =>
      formatCurrency(Number(amount) || 0, currency),
  };
}
