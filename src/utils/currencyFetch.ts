import { CURRENCY_OPTIONS } from './currency';
import { useExpenseStore } from '../store/useExpenseStore';

const API_BASE = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies';

/**
 * Fetch latest exchange rates from a free, open-source currency API.
 * Rates are relative to the user's base currency.
 * Returns array of { from, rate } objects for all known CURRENCY_OPTIONS.
 */
export async function fetchExchangeRates(): Promise<{ from: string; rate: number }[] | null> {
  const state = useExpenseStore.getState();
  const baseCurrency = CURRENCY_OPTIONS.find((c) => c.symbol === state.currencySymbol);
  const baseCode = (baseCurrency?.code || 'USD').toLowerCase();

  try {
    const response = await fetch(`${API_BASE}/${baseCode}.json`);
    if (!response.ok) return null;
    const data = await response.json();
    const rates = data[baseCode];
    if (!rates) return null;

    const result: { from: string; rate: number }[] = [];
    for (const opt of CURRENCY_OPTIONS) {
      const code = opt.code.toLowerCase();
      if (code === baseCode) continue;
      const foreignRate = rates[code];
      if (foreignRate && foreignRate > 0) {
        // rate = how many base currency units per 1 foreign unit
        result.push({ from: opt.code, rate: 1 / foreignRate });
      }
    }
    return result;
  } catch {
    return null;
  }
}

/**
 * Fetch and apply exchange rates to the store.
 * Returns true if successful.
 */
export async function syncExchangeRates(): Promise<boolean> {
  const rates = await fetchExchangeRates();
  if (!rates) return false;

  const { addExchangeRate } = useExpenseStore.getState();
  rates.forEach((r) => addExchangeRate(r));
  return true;
}
