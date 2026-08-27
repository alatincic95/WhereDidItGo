import { getCurrencySymbol } from '../utils/currency';

// formatCurrency depends on the Zustand store (useExpenseStore.getState()),
// so we test it in the store integration tests. Here we test pure helpers.

describe('getCurrencySymbol', () => {
  it('returns $ for USD', () => {
    expect(getCurrencySymbol('USD')).toBe('$');
  });

  it('returns € for EUR', () => {
    expect(getCurrencySymbol('EUR')).toBe('€');
  });

  it('returns £ for GBP', () => {
    expect(getCurrencySymbol('GBP')).toBe('£');
  });

  it('returns the code itself for unknown currencies', () => {
    expect(getCurrencySymbol('XYZ')).toBe('XYZ');
  });

  it('returns kr for SEK', () => {
    expect(getCurrencySymbol('SEK')).toBe('kr');
  });

  it('returns zł for PLN', () => {
    expect(getCurrencySymbol('PLN')).toBe('zł');
  });
});
