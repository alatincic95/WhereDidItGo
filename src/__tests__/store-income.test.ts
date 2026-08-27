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

describe('Income CRUD', () => {
  it('adds income with generated ID', () => {
    useExpenseStore.getState().addIncome({
      amount: 500,
      source: 'Bonus',
      description: 'Q3 bonus',
      date: '2026-08-18T12:00:00.000Z',
    });

    const incomes = useExpenseStore.getState().incomes;
    expect(incomes).toHaveLength(1);
    expect(incomes[0].amount).toBe(500);
    expect(incomes[0].source).toBe('Bonus');
    expect(incomes[0].id).toBeDefined();
  });

  it('updates income', () => {
    useExpenseStore.setState({
      incomes: [{ id: 'i1', amount: 500, source: 'Bonus', description: 'Q3', date: '2026-08-18T12:00:00.000Z' }],
    });

    useExpenseStore.getState().updateIncome('i1', { amount: 750 });
    expect(useExpenseStore.getState().incomes[0].amount).toBe(750);
  });

  it('deletes income', () => {
    useExpenseStore.setState({
      incomes: [{ id: 'i1', amount: 500, source: 'Bonus', description: '', date: '2026-08-18T12:00:00.000Z' }],
    });

    useExpenseStore.getState().deleteIncome('i1');
    expect(useExpenseStore.getState().incomes).toHaveLength(0);
  });

  it('addIncomeWithId restores with specific ID', () => {
    useExpenseStore.getState().addIncomeWithId({
      id: 'restored-i1',
      amount: 200,
      source: 'Gift',
      description: 'Birthday',
      date: '2026-08-18T12:00:00.000Z',
    });

    expect(useExpenseStore.getState().incomes[0].id).toBe('restored-i1');
  });
});

describe('Fixed Income', () => {
  it('adds fixed income', () => {
    useExpenseStore.getState().addFixedIncome({
      amount: 200,
      source: 'Investment',
      description: 'Dividends',
      frequency: 'monthly',
    });

    const fixed = useExpenseStore.getState().fixedIncomes;
    expect(fixed).toHaveLength(1);
    expect(fixed[0].amount).toBe(200);
    expect(fixed[0].startDate).toBeDefined();
  });

  it('getFixedIncomesTotal applies frequency multipliers', () => {
    useExpenseStore.setState({
      fixedIncomes: [
        { id: 'fi1', amount: 200, source: 'Investment', description: 'Monthly', frequency: 'monthly' },
        { id: 'fi2', amount: 1200, source: 'Other', description: 'Yearly', frequency: 'yearly' },
      ],
    });

    const total = useExpenseStore.getState().getFixedIncomesTotal();
    // 200 * 1 + 1200 * (1/12) = 200 + 100
    expect(total).toBeCloseTo(300, 2);
  });
});

describe('Income computed values', () => {
  it('getMonthlyExtraIncome sums income for a month', () => {
    useExpenseStore.setState({
      incomes: [
        { id: 'i1', amount: 500, source: 'Bonus', description: '', date: '2026-08-15T12:00:00.000Z' },
        { id: 'i2', amount: 300, source: 'Freelance', description: '', date: '2026-08-20T12:00:00.000Z' },
        { id: 'i3', amount: 100, source: 'Gift', description: '', date: '2026-09-15T12:00:00.000Z' },
      ],
    });

    expect(useExpenseStore.getState().getMonthlyExtraIncome('2026-08')).toBe(800);
  });

  it('getTotalExtraIncomeAllTime sums all income', () => {
    useExpenseStore.setState({
      incomes: [
        { id: 'i1', amount: 500, source: 'Bonus', description: '', date: '2026-08-15T12:00:00.000Z' },
        { id: 'i2', amount: 300, source: 'Freelance', description: '', date: '2026-09-15T12:00:00.000Z' },
      ],
    });

    expect(useExpenseStore.getState().getTotalExtraIncomeAllTime()).toBe(800);
  });
});
