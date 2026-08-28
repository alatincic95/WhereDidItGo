import { buildFullExport, buildBackupJson, validateBackup } from '../utils/exportData';

describe('buildFullExport (CSV)', () => {
  it('generates CSV with correct headers and data', () => {
    const csv = buildFullExport({
      expenses: [
        { id: '1', amount: 45.99, category: 'Food', description: 'Groceries', date: '2026-08-01T12:00:00.000Z', isFixed: false },
      ],
      incomes: [
        { id: 'i1', amount: 500, source: 'Bonus', description: 'Q3 bonus', date: '2026-08-01T12:00:00.000Z' },
      ],
      fixedExpenses: [
        { id: 'f1', amount: 1200, category: 'Housing', description: 'Rent' },
      ],
      fixedIncomes: [
        { id: 'fi1', amount: 200, source: 'Investment', description: 'Dividends' },
      ],
    });

    expect(csv).toContain('=== EXPENSES ===');
    expect(csv).toContain('Date,Amount,Currency,Category,Description,Budget Linked,Pending');
    expect(csv).toContain('45.99');
    expect(csv).toContain('Food');
    expect(csv).toContain('Groceries');

    expect(csv).toContain('=== ONE-TIME INCOME ===');
    expect(csv).toContain('500.00');
    expect(csv).toContain('Bonus');

    expect(csv).toContain('=== RECURRING EXPENSES ===');
    expect(csv).toContain('1200.00');
    expect(csv).toContain('Rent');

    expect(csv).toContain('=== RECURRING INCOME ===');
    expect(csv).toContain('200.00');
    expect(csv).toContain('Dividends');
  });

  it('escapes commas in descriptions', () => {
    const csv = buildFullExport({
      expenses: [
        { id: '1', amount: 10, category: 'Food', description: 'Coffee, tea', date: '2026-08-01T12:00:00.000Z', isFixed: false },
      ],
      incomes: [],
      fixedExpenses: [],
      fixedIncomes: [],
    });

    expect(csv).toContain('"Coffee, tea"');
  });

  it('handles empty arrays', () => {
    const csv = buildFullExport({
      expenses: [],
      incomes: [],
      fixedExpenses: [],
      fixedIncomes: [],
    });

    expect(csv).toContain('=== EXPENSES ===');
    expect(csv).toContain('=== ONE-TIME INCOME ===');
    // Should have headers but no data rows
    const lines = csv.split('\n').filter((l) => l.trim());
    const headerCount = lines.filter((l) => l.startsWith('Date,') || l.startsWith('Amount,')).length;
    expect(headerCount).toBe(4); // 4 section headers
  });
});

describe('buildBackupJson', () => {
  it('produces valid JSON with _meta', () => {
    const json = buildBackupJson({
      expenses: [],
      fixedExpenses: [],
      incomes: [],
      fixedIncomes: [],
      budgets: [],
      customCategories: [],
      exchangeRates: [],
      savingsGoals: [],
      budgetTemplates: [],
      initialBalance: 1000,
      monthlyIncome: 3000,
      currencySymbol: '$',
    });

    const parsed = JSON.parse(json);
    expect(parsed._meta.app).toBe('WhereDidItGo');
    expect(parsed._meta.version).toBe(1);
    expect(parsed._meta.exportedAt).toBeDefined();
    expect(parsed.initialBalance).toBe(1000);
    expect(parsed.monthlyIncome).toBe(3000);
  });
});

describe('validateBackup', () => {
  it('rejects invalid JSON', () => {
    const result = validateBackup('not json');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain('Invalid JSON');
  });

  it('rejects non-WhereDidItGo backups', () => {
    const result = validateBackup(JSON.stringify({ _meta: { app: 'OtherApp' } }));
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain('Not a WhereDidItGo');
  });

  it('defaults missing arrays to empty and accepts backup', () => {
    const result = validateBackup(JSON.stringify({ _meta: { app: 'WhereDidItGo', version: 1, exportedAt: '2026-08-01' } }));
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.expenses).toEqual([]);
      expect(result.data.incomes).toEqual([]);
      expect(result.data.monthlyIncome).toBe(0);
      expect(result.data.currencySymbol).toBe('$');
    }
  });

  it('accepts valid backup', () => {
    const backup = {
      _meta: { app: 'WhereDidItGo', version: 1, exportedAt: '2026-08-01' },
      expenses: [],
      fixedExpenses: [],
      incomes: [],
      fixedIncomes: [],
      budgets: [],
      customCategories: [],
      exchangeRates: [],
      savingsGoals: [],
      budgetTemplates: [],
      initialBalance: 0,
      monthlyIncome: 0,
      currencySymbol: '$',
    };
    const result = validateBackup(JSON.stringify(backup));
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.expenses).toEqual([]);
      expect(result.data._meta.app).toBe('WhereDidItGo');
    }
  });
});
