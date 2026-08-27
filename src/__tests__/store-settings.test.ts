import { useExpenseStore } from '../store/useExpenseStore';
import { EXPENSE_CATEGORIES, DEFAULT_DASHBOARD_CARDS } from '../types';

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
    dashboardCards: DEFAULT_DASHBOARD_CARDS,
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

describe('Settings', () => {
  it('setMonthlyIncome updates income', () => {
    useExpenseStore.getState().setMonthlyIncome(5000);
    expect(useExpenseStore.getState().monthlyIncome).toBe(5000);
  });

  it('setInitialBalance updates balance', () => {
    useExpenseStore.getState().setInitialBalance(10000);
    expect(useExpenseStore.getState().initialBalance).toBe(10000);
  });

  it('setCurrencySymbol updates symbol', () => {
    useExpenseStore.getState().setCurrencySymbol('€');
    expect(useExpenseStore.getState().currencySymbol).toBe('€');
  });

  it('setThemeMode toggles theme', () => {
    useExpenseStore.getState().setThemeMode('light');
    expect(useExpenseStore.getState().themeMode).toBe('light');
    useExpenseStore.getState().setThemeMode('dark');
    expect(useExpenseStore.getState().themeMode).toBe('dark');
  });

  it('setBiometricEnabled toggles biometric', () => {
    useExpenseStore.getState().setBiometricEnabled(true);
    expect(useExpenseStore.getState().biometricEnabled).toBe(true);
  });

  it('setOnboardingCompleted marks onboarding done', () => {
    useExpenseStore.getState().setOnboardingCompleted(true);
    expect(useExpenseStore.getState().onboardingCompleted).toBe(true);
  });
});

describe('Exchange Rates', () => {
  it('adds an exchange rate', () => {
    useExpenseStore.getState().addExchangeRate({ from: 'EUR', rate: 1.1 });
    expect(useExpenseStore.getState().exchangeRates).toHaveLength(1);
    expect(useExpenseStore.getState().exchangeRates[0]).toEqual({ from: 'EUR', rate: 1.1 });
  });

  it('replaces existing rate for same currency', () => {
    useExpenseStore.getState().addExchangeRate({ from: 'EUR', rate: 1.1 });
    useExpenseStore.getState().addExchangeRate({ from: 'EUR', rate: 1.2 });
    expect(useExpenseStore.getState().exchangeRates).toHaveLength(1);
    expect(useExpenseStore.getState().exchangeRates[0].rate).toBe(1.2);
  });

  it('converts amount to base currency', () => {
    useExpenseStore.getState().addExchangeRate({ from: 'EUR', rate: 1.1 });
    expect(useExpenseStore.getState().convertToBase(100, 'EUR')).toBeCloseTo(110);
  });

  it('returns amount unchanged when no currency specified', () => {
    expect(useExpenseStore.getState().convertToBase(100)).toBe(100);
    expect(useExpenseStore.getState().convertToBase(100, undefined)).toBe(100);
  });

  it('returns amount unchanged for unknown currency', () => {
    expect(useExpenseStore.getState().convertToBase(100, 'XYZ')).toBe(100);
  });

  it('deletes an exchange rate', () => {
    useExpenseStore.getState().addExchangeRate({ from: 'EUR', rate: 1.1 });
    useExpenseStore.getState().addExchangeRate({ from: 'GBP', rate: 1.3 });
    useExpenseStore.getState().deleteExchangeRate('EUR');
    expect(useExpenseStore.getState().exchangeRates).toHaveLength(1);
    expect(useExpenseStore.getState().exchangeRates[0].from).toBe('GBP');
  });
});

describe('Custom Categories', () => {
  it('adds a custom category', () => {
    useExpenseStore.getState().addCustomCategory({ name: 'Pets', icon: 'pets', color: '#FF6B6B' });
    expect(useExpenseStore.getState().customCategories).toHaveLength(1);
    expect(useExpenseStore.getState().customCategories[0].name).toBe('Pets');
  });

  it('deletes a custom category and removes from order', () => {
    useExpenseStore.setState({
      customCategories: [{ name: 'Pets', icon: 'pets', color: '#FF6B6B' }],
      categoryOrder: ['Food', 'Pets', 'Transport'],
    });

    useExpenseStore.getState().deleteCustomCategory('Pets');
    expect(useExpenseStore.getState().customCategories).toHaveLength(0);
    expect(useExpenseStore.getState().categoryOrder).toEqual(['Food', 'Transport']);
  });
});

describe('Category Ordering', () => {
  it('getOrderedCategories returns defaults when no order set', () => {
    const ordered = useExpenseStore.getState().getOrderedCategories();
    expect(ordered).toEqual(EXPENSE_CATEGORIES);
  });

  it('getOrderedCategories respects saved order', () => {
    useExpenseStore.setState({
      categoryOrder: ['Transport', 'Food'],
    });

    const ordered = useExpenseStore.getState().getOrderedCategories();
    expect(ordered[0]).toBe('Transport');
    expect(ordered[1]).toBe('Food');
    // Remaining categories follow
    expect(ordered.length).toBe(EXPENSE_CATEGORIES.length);
  });

  it('getOrderedCategories includes custom categories', () => {
    useExpenseStore.setState({
      customCategories: [{ name: 'Pets', icon: 'pets', color: '#FF6B6B' }],
    });

    const ordered = useExpenseStore.getState().getOrderedCategories();
    expect(ordered).toContain('Pets');
    expect(ordered.length).toBe(EXPENSE_CATEGORIES.length + 1);
  });

  it('getOrderedCategories appends new categories not in saved order', () => {
    useExpenseStore.setState({
      categoryOrder: ['Food', 'Transport'],
      customCategories: [{ name: 'Pets', icon: 'pets', color: '#FF6B6B' }],
    });

    const ordered = useExpenseStore.getState().getOrderedCategories();
    expect(ordered[0]).toBe('Food');
    expect(ordered[1]).toBe('Transport');
    // Pets and remaining built-in categories appended after
    expect(ordered).toContain('Pets');
  });
});

describe('Category Budgets', () => {
  it('sets a category budget', () => {
    useExpenseStore.getState().setCategoryBudget('Food', 400);
    const budgets = useExpenseStore.getState().categoryBudgets;
    expect(budgets).toHaveLength(1);
    expect(budgets[0]).toEqual({ category: 'Food', monthlyLimit: 400, enabled: true });
  });

  it('updates existing category budget', () => {
    useExpenseStore.getState().setCategoryBudget('Food', 400);
    useExpenseStore.getState().setCategoryBudget('Food', 500);
    expect(useExpenseStore.getState().categoryBudgets).toHaveLength(1);
    expect(useExpenseStore.getState().categoryBudgets[0].monthlyLimit).toBe(500);
  });

  it('toggles category budget enabled/disabled', () => {
    useExpenseStore.getState().setCategoryBudget('Food', 400);
    expect(useExpenseStore.getState().categoryBudgets[0].enabled).toBe(true);

    useExpenseStore.getState().toggleCategoryBudget('Food');
    expect(useExpenseStore.getState().categoryBudgets[0].enabled).toBe(false);

    useExpenseStore.getState().toggleCategoryBudget('Food');
    expect(useExpenseStore.getState().categoryBudgets[0].enabled).toBe(true);
  });

  it('removes a category budget', () => {
    useExpenseStore.getState().setCategoryBudget('Food', 400);
    useExpenseStore.getState().setCategoryBudget('Transport', 200);
    useExpenseStore.getState().removeCategoryBudget('Food');
    expect(useExpenseStore.getState().categoryBudgets).toHaveLength(1);
    expect(useExpenseStore.getState().categoryBudgets[0].category).toBe('Transport');
  });

  it('getCategoryBudgetStatus computes spent and percentage', () => {
    useExpenseStore.setState({
      categoryBudgets: [{ category: 'Food', monthlyLimit: 400, enabled: true }],
      expenses: [
        { id: 'e1', amount: 100, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false },
        { id: 'e2', amount: 50, category: 'Food', description: '', date: '2026-08-16T12:00:00.000Z', isFixed: false },
        { id: 'e3', amount: 200, category: 'Transport', description: '', date: '2026-08-16T12:00:00.000Z', isFixed: false },
      ],
      fixedExpenses: [],
    });

    const statuses = useExpenseStore.getState().getCategoryBudgetStatus('2026-08');
    expect(statuses).toHaveLength(1);
    expect(statuses[0].category).toBe('Food');
    expect(statuses[0].spent).toBe(150);
    expect(statuses[0].limit).toBe(400);
    expect(statuses[0].percentage).toBeCloseTo(0.375);
  });

  it('getCategoryBudgetStatus includes fixed expenses', () => {
    useExpenseStore.setState({
      categoryBudgets: [{ category: 'Housing', monthlyLimit: 1500, enabled: true }],
      expenses: [],
      fixedExpenses: [
        { id: 'f1', amount: 1200, category: 'Housing', description: 'Rent', frequency: 'monthly' },
      ],
    });

    const statuses = useExpenseStore.getState().getCategoryBudgetStatus('2026-08');
    expect(statuses[0].spent).toBe(1200);
    expect(statuses[0].percentage).toBeCloseTo(0.8);
  });
});

describe('Dashboard Cards', () => {
  it('sets custom dashboard card order', () => {
    const custom = [
      { id: 'quickActions' as const, visible: true },
      { id: 'summary' as const, visible: false },
    ];
    useExpenseStore.getState().setDashboardCards(custom);
    expect(useExpenseStore.getState().dashboardCards).toEqual(custom);
  });

  it('resets to default dashboard cards', () => {
    useExpenseStore.getState().setDashboardCards([{ id: 'summary', visible: false }]);
    useExpenseStore.getState().resetDashboardCards();
    expect(useExpenseStore.getState().dashboardCards).toEqual(DEFAULT_DASHBOARD_CARDS);
  });
});
