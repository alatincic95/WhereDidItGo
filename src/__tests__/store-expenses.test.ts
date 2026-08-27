import { useExpenseStore } from '../store/useExpenseStore';

// Helper to reset store to a clean state before each test
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

describe('Expense CRUD', () => {
  it('adds an expense with generated ID', () => {
    const store = useExpenseStore.getState();
    store.addExpense({
      amount: 50,
      category: 'Food',
      description: 'Lunch',
      date: '2026-08-18T12:00:00.000Z',
      isFixed: false,
    });

    const expenses = useExpenseStore.getState().expenses;
    expect(expenses).toHaveLength(1);
    expect(expenses[0].amount).toBe(50);
    expect(expenses[0].category).toBe('Food');
    expect(expenses[0].id).toBeDefined();
    expect(expenses[0].id.length).toBeGreaterThan(0);
  });

  it('updates an existing expense', () => {
    useExpenseStore.setState({
      expenses: [{ id: 'e1', amount: 50, category: 'Food', description: 'Lunch', date: '2026-08-18T12:00:00.000Z', isFixed: false }],
    });

    useExpenseStore.getState().updateExpense('e1', { amount: 75, description: 'Dinner' });
    const e = useExpenseStore.getState().expenses[0];
    expect(e.amount).toBe(75);
    expect(e.description).toBe('Dinner');
    expect(e.category).toBe('Food'); // unchanged
  });

  it('deletes an expense', () => {
    useExpenseStore.setState({
      expenses: [
        { id: 'e1', amount: 50, category: 'Food', description: '', date: '2026-08-18T12:00:00.000Z', isFixed: false },
        { id: 'e2', amount: 30, category: 'Transport', description: '', date: '2026-08-18T12:00:00.000Z', isFixed: false },
      ],
    });

    useExpenseStore.getState().deleteExpense('e1');
    const expenses = useExpenseStore.getState().expenses;
    expect(expenses).toHaveLength(1);
    expect(expenses[0].id).toBe('e2');
  });

  it('addExpenseWithId restores with a specific ID (undo support)', () => {
    const expense = { id: 'restored-1', amount: 100, category: 'Health', description: 'Gym', date: '2026-08-18T12:00:00.000Z', isFixed: false };
    useExpenseStore.getState().addExpenseWithId(expense);

    const expenses = useExpenseStore.getState().expenses;
    expect(expenses).toHaveLength(1);
    expect(expenses[0].id).toBe('restored-1');
  });

  it('markExpenseCompleted sets isPending to false', () => {
    useExpenseStore.setState({
      expenses: [{ id: 'e1', amount: 50, category: 'Food', description: '', date: '2026-08-18T12:00:00.000Z', isFixed: false, isPending: true }],
    });

    useExpenseStore.getState().markExpenseCompleted('e1');
    expect(useExpenseStore.getState().expenses[0].isPending).toBe(false);
  });
});

describe('Fixed Expense CRUD', () => {
  it('adds a fixed expense', () => {
    useExpenseStore.getState().addFixedExpense({
      amount: 1200,
      category: 'Housing',
      description: 'Rent',
      frequency: 'monthly',
    });

    const fixed = useExpenseStore.getState().fixedExpenses;
    expect(fixed).toHaveLength(1);
    expect(fixed[0].amount).toBe(1200);
    expect(fixed[0].startDate).toBeDefined();
  });

  it('deletes a fixed expense', () => {
    useExpenseStore.setState({
      fixedExpenses: [{ id: 'f1', amount: 1200, category: 'Housing', description: 'Rent' }],
    });

    useExpenseStore.getState().deleteFixedExpense('f1');
    expect(useExpenseStore.getState().fixedExpenses).toHaveLength(0);
  });
});

describe('Expense computed values', () => {
  it('getMonthlyExpenses filters by month', () => {
    useExpenseStore.setState({
      expenses: [
        { id: 'e1', amount: 50, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false },
        { id: 'e2', amount: 30, category: 'Food', description: '', date: '2026-09-15T12:00:00.000Z', isFixed: false },
        { id: 'e3', amount: 20, category: 'Food', description: '', date: '2026-08-20T12:00:00.000Z', isFixed: false },
      ],
    });

    const aug = useExpenseStore.getState().getMonthlyExpenses('2026-08');
    expect(aug).toHaveLength(2);
    expect(aug.map((e) => e.id).sort()).toEqual(['e1', 'e3']);
  });

  it('getMonthlyTotal sums expenses for a month, excluding isFixed', () => {
    useExpenseStore.setState({
      expenses: [
        { id: 'e1', amount: 50, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false },
        { id: 'e2', amount: 30, category: 'Food', description: '', date: '2026-08-16T12:00:00.000Z', isFixed: false },
        { id: 'e3', amount: 100, category: 'Food', description: '', date: '2026-08-17T12:00:00.000Z', isFixed: true }, // auto-generated, excluded
      ],
    });

    const total = useExpenseStore.getState().getMonthlyTotal('2026-08');
    expect(total).toBe(80); // 50 + 30, excludes isFixed
  });

  it('getFixedExpensesTotal applies frequency multipliers', () => {
    useExpenseStore.setState({
      fixedExpenses: [
        { id: 'f1', amount: 1200, category: 'Housing', description: 'Rent', frequency: 'monthly' },
        { id: 'f2', amount: 100, category: 'Bills', description: 'Weekly bill', frequency: 'weekly' },
      ],
    });

    const total = useExpenseStore.getState().getFixedExpensesTotal();
    // 1200 * 1 + 100 * (52/12) = 1200 + 433.33...
    expect(total).toBeCloseTo(1200 + 100 * (52 / 12), 2);
  });

  it('getFixedExpensesTotal defaults to monthly when frequency is absent', () => {
    useExpenseStore.setState({
      fixedExpenses: [
        { id: 'f1', amount: 500, category: 'Bills', description: 'Utilities' }, // no frequency
      ],
    });

    expect(useExpenseStore.getState().getFixedExpensesTotal()).toBe(500);
  });

  it('getCategoryTotals breaks down by category including splits', () => {
    useExpenseStore.setState({
      expenses: [
        { id: 'e1', amount: 100, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false },
        {
          id: 'e2', amount: 60, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false,
          splits: [
            { category: 'Food', amount: 40 },
            { category: 'Transport', amount: 20 },
          ],
        },
      ],
      fixedExpenses: [
        { id: 'f1', amount: 50, category: 'Bills', description: 'Internet', frequency: 'monthly' },
      ],
    });

    const totals = useExpenseStore.getState().getCategoryTotals('2026-08');
    expect(totals['Food']).toBe(140); // 100 + 40 from split
    expect(totals['Transport']).toBe(20);
    expect(totals['Bills']).toBe(50);
  });

  it('getAllTags returns sorted unique tags', () => {
    useExpenseStore.setState({
      expenses: [
        { id: 'e1', amount: 10, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false, tags: ['Vacation', 'Business'] },
        { id: 'e2', amount: 20, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false, tags: ['Vacation', 'Personal'] },
        { id: 'e3', amount: 30, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false },
      ],
    });

    expect(useExpenseStore.getState().getAllTags()).toEqual(['Business', 'Personal', 'Vacation']);
  });

  it('convertExpenseToRecurring moves expense to fixedExpenses', () => {
    useExpenseStore.setState({
      expenses: [
        { id: 'e1', amount: 50, category: 'Food', description: 'Weekly groceries', date: '2026-08-15T12:00:00.000Z', isFixed: false },
      ],
    });

    useExpenseStore.getState().convertExpenseToRecurring('e1', 'weekly');

    expect(useExpenseStore.getState().expenses).toHaveLength(0);
    const fixed = useExpenseStore.getState().fixedExpenses;
    expect(fixed).toHaveLength(1);
    expect(fixed[0].amount).toBe(50);
    expect(fixed[0].frequency).toBe('weekly');
  });
});
