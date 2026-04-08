import { useExpenseStore } from '../store/useExpenseStore';

export const formatCurrency = (amount: number): string => {
  const symbol = useExpenseStore.getState().currencySymbol;
  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const CURRENCY_OPTIONS = [
  { symbol: '$', label: 'USD ($)', code: 'USD' },
  { symbol: '€', label: 'EUR (€)', code: 'EUR' },
  { symbol: '£', label: 'GBP (£)', code: 'GBP' },
  { symbol: '¥', label: 'JPY (¥)', code: 'JPY' },
  { symbol: '₹', label: 'INR (₹)', code: 'INR' },
  { symbol: 'kr', label: 'SEK/NOK/DKK (kr)', code: 'SEK' },
  { symbol: 'CHF', label: 'CHF', code: 'CHF' },
  { symbol: 'A$', label: 'AUD (A$)', code: 'AUD' },
  { symbol: 'C$', label: 'CAD (C$)', code: 'CAD' },
  { symbol: 'R$', label: 'BRL (R$)', code: 'BRL' },
  { symbol: 'zł', label: 'PLN (zł)', code: 'PLN' },
  { symbol: 'Kč', label: 'CZK (Kč)', code: 'CZK' },
  { symbol: '₺', label: 'TRY (₺)', code: 'TRY' },
  { symbol: 'HRK', label: 'HRK', code: 'HRK' },
];

/** Get the symbol for a currency code */
export const getCurrencySymbol = (code: string): string => {
  const option = CURRENCY_OPTIONS.find((c) => c.code === code);
  return option?.symbol || code;
};

/** Format an amount with a specific currency code */
export const formatCurrencyWithCode = (amount: number, code: string): string => {
  const sym = getCurrencySymbol(code);
  const sign = amount < 0 ? '-' : '';
  return `${sign}${sym}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
