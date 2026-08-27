import { useExpenseStore } from '../store/useExpenseStore';

function resetStore() {
  useExpenseStore.setState({
    expenses: [],
    fixedExpenses: [],
    incomes: [],
    fixedIncomes: [],
    budgets: [],
    customCategories: [],
    categoryOrder: [],
    categoryBudgets: [],
    exchangeRates: [],
    savingsGoals: [],
    budgetTemplates: [],
    dashboardCards: [],
    initialBalance: 0,
    monthlyIncome: 3000,
    currencySymbol: '$',
    themeMode: 'dark',
    biometricEnabled: false,
    pushNotificationsEnabled: false,
    onboardingCompleted: false,
  });
}

beforeEach(() => resetStore());

describe('getMonthlyBalance', () => {
  it('calculates monthly balance = income + fixedIncome + extra - expenses - fixedExpenses', () => {
    useExpenseStore.setState({
      monthlyIncome: 3000,
      fixedIncomes: [{ id: 'fi1', amount: 500, source: 'Investment', description: '', frequency: 'monthly' }],
      incomes: [{ id: 'i1', amount: 200, source: 'Gift', description: '', date: '2026-08-15T12:00:00.000Z' }],
      expenses: [{ id: 'e1', amount: 800, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false }],
      fixedExpenses: [{ id: 'f1', amount: 1200, category: 'Housing', description: 'Rent', frequency: 'monthly' }],
    });

    // 3000 + 500 + 200 - 800 - 1200 = 1700
    expect(useExpenseStore.getState().getMonthlyBalance('2026-08')).toBe(1700);
  });

  it('returns income when no expenses', () => {
    useExpenseStore.setState({ monthlyIncome: 3000 });
    expect(useExpenseStore.getState().getMonthlyBalance('2026-08')).toBe(3000);
  });

  it('returns negative when expenses exceed income', () => {
    useExpenseStore.setState({
      monthlyIncome: 1000,
      expenses: [
        { id: 'e1', amount: 1500, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false },
      ],
    });

    expect(useExpenseStore.getState().getMonthlyBalance('2026-08')).toBe(-500);
  });
});

describe('getOverallBalance', () => {
  it('accumulates balance across all tracked months', () => {
    useExpenseStore.setState({
      initialBalance: 5000,
      monthlyIncome: 3000,
      expenses: [
        { id: 'e1', amount: 1000, category: 'Food', description: '', date: '2026-07-15T12:00:00.000Z', isFixed: false },
        { id: 'e2', amount: 2000, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false },
      ],
    });

    // Tracked months: 2026-07, 2026-08, and current month
    // Each month: 3000 (income) - expenses for that month
    // July: 3000 - 1000 = 2000
    // Aug: 3000 - 2000 = 1000
    // Current (if different from above): 3000 - 0 = 3000
    const balance = useExpenseStore.getState().getOverallBalance();
    expect(balance).toBeGreaterThan(5000); // at least initial + some months
  });

  it('uses initial balance as starting point', () => {
    useExpenseStore.setState({ initialBalance: 10000, monthlyIncome: 0 });
    // Only current month tracked, income=0, no expenses
    expect(useExpenseStore.getState().getOverallBalance()).toBe(10000);
  });
});

describe('getTrackedMonths', () => {
  it('includes months from expenses and incomes', () => {
    useExpenseStore.setState({
      expenses: [
        { id: 'e1', amount: 10, category: 'Food', description: '', date: '2026-06-15T12:00:00.000Z', isFixed: false },
        { id: 'e2', amount: 20, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false },
      ],
      incomes: [
        { id: 'i1', amount: 100, source: 'Gift', description: '', date: '2026-07-15T12:00:00.000Z' },
      ],
    });

    const months = useExpenseStore.getState().getTrackedMonths();
    expect(months).toContain('2026-06');
    expect(months).toContain('2026-07');
    expect(months).toContain('2026-08');
  });

  it('always includes current month', () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const months = useExpenseStore.getState().getTrackedMonths();
    expect(months).toContain(currentMonth);
  });

  it('returns sorted months', () => {
    useExpenseStore.setState({
      expenses: [
        { id: 'e1', amount: 10, category: 'Food', description: '', date: '2026-12-15T12:00:00.000Z', isFixed: false },
        { id: 'e2', amount: 10, category: 'Food', description: '', date: '2026-01-15T12:00:00.000Z', isFixed: false },
      ],
    });

    const months = useExpenseStore.getState().getTrackedMonths();
    for (let i = 1; i < months.length; i++) {
      expect(months[i] >= months[i - 1]).toBe(true);
    }
  });
});

describe('getMonthlyTotalsHistory', () => {
  it('returns expense and income totals per month', () => {
    useExpenseStore.setState({
      monthlyIncome: 3000,
      expenses: [
        { id: 'e1', amount: 500, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false },
      ],
      incomes: [
        { id: 'i1', amount: 200, source: 'Gift', description: '', date: '2026-08-15T12:00:00.000Z' },
      ],
    });

    const history = useExpenseStore.getState().getMonthlyTotalsHistory();
    const aug = history.find((h) => h.month === '2026-08');
    expect(aug).toBeDefined();
    expect(aug!.expenses).toBe(500); // monthly total + fixed total (0 here)
    expect(aug!.income).toBe(3200); // 3000 base + 200 extra
  });
});

describe('getYearOverYearData', () => {
  it('groups data by month across years', () => {
    useExpenseStore.setState({
      monthlyIncome: 1000,
      expenses: [
        { id: 'e1', amount: 100, category: 'Food', description: '', date: '2025-08-15T12:00:00.000Z', isFixed: false },
        { id: 'e2', amount: 200, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false },
      ],
    });

    const yoy = useExpenseStore.getState().getYearOverYearData();
    const augData = yoy.find((d) => d.monthLabel === 'Aug');
    expect(augData).toBeDefined();
    expect(augData!.years.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Multi-currency integration', () => {
  it('getMonthlyTotal converts foreign currency expenses', () => {
    useExpenseStore.setState({
      exchangeRates: [{ from: 'EUR', rate: 1.1 }],
      expenses: [
        { id: 'e1', amount: 100, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false, currency: 'EUR' },
        { id: 'e2', amount: 50, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false }, // base currency
      ],
    });

    const total = useExpenseStore.getState().getMonthlyTotal('2026-08');
    expect(total).toBeCloseTo(160); // 100*1.1 + 50
  });

  it('getTotalExpensesAllTime handles mixed currencies', () => {
    useExpenseStore.setState({
      exchangeRates: [{ from: 'GBP', rate: 1.3 }],
      expenses: [
        { id: 'e1', amount: 100, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false, currency: 'GBP' },
        { id: 'e2', amount: 200, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false },
      ],
    });

    expect(useExpenseStore.getState().getTotalExpensesAllTime()).toBeCloseTo(330); // 100*1.3 + 200
  });
});

describe('Backup & Restore', () => {
  it('getBackupState returns all data', () => {
    useExpenseStore.setState({
      expenses: [{ id: 'e1', amount: 50, category: 'Food', description: '', date: '2026-08-18T12:00:00.000Z', isFixed: false }],
      monthlyIncome: 5000,
      currencySymbol: '€',
    });

    const backup = useExpenseStore.getState().getBackupState();
    expect(backup.expenses).toHaveLength(1);
    expect(backup.monthlyIncome).toBe(5000);
    expect(backup.currencySymbol).toBe('€');
  });

  it('restoreFromBackup replaces all state', () => {
    useExpenseStore.setState({
      expenses: [{ id: 'old', amount: 999, category: 'Food', description: '', date: '2026-01-01T12:00:00.000Z', isFixed: false }],
    });

    useExpenseStore.getState().restoreFromBackup({
      expenses: [{ id: 'new', amount: 100, category: 'Transport', description: '', date: '2026-08-01T12:00:00.000Z', isFixed: false }],
      fixedExpenses: [],
      incomes: [],
      fixedIncomes: [],
      budgets: [],
      customCategories: [],
      exchangeRates: [],
      savingsGoals: [],
      budgetTemplates: [],
      initialBalance: 1000,
      monthlyIncome: 4000,
      currencySymbol: '£',
    });

    const state = useExpenseStore.getState();
    expect(state.expenses).toHaveLength(1);
    expect(state.expenses[0].id).toBe('new');
    expect(state.initialBalance).toBe(1000);
    expect(state.monthlyIncome).toBe(4000);
    expect(state.currencySymbol).toBe('£');
  });

  it('restoreFromBackup handles missing optional fields', () => {
    useExpenseStore.getState().restoreFromBackup({
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
      // categoryBudgets and dashboardCards omitted
    });

    expect(useExpenseStore.getState().categoryBudgets).toEqual([]);
    expect(useExpenseStore.getState().dashboardCards).toBeDefined();
  });
});
