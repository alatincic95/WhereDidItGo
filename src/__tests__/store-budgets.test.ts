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

describe('Budget CRUD', () => {
  it('adds a budget with generated ID and createdAt', () => {
    useExpenseStore.getState().addBudget({
      name: 'Vacation',
      description: 'Summer trip',
      budget: 2000,
      color: '#FF6B9D',
      status: 'active',
    });

    const budgets = useExpenseStore.getState().budgets;
    expect(budgets).toHaveLength(1);
    expect(budgets[0].name).toBe('Vacation');
    expect(budgets[0].id).toBeDefined();
    expect(budgets[0].createdAt).toBeDefined();
  });

  it('updates a budget', () => {
    useExpenseStore.setState({
      budgets: [{ id: 'b1', name: 'Vacation', description: '', budget: 2000, color: '#FF6B9D', status: 'active', createdAt: '2026-08-01' }],
    });

    useExpenseStore.getState().updateBudget('b1', { name: 'Beach Vacation', budget: 3000 });
    const b = useExpenseStore.getState().budgets[0];
    expect(b.name).toBe('Beach Vacation');
    expect(b.budget).toBe(3000);
  });

  it('deletes budget and unlinks expenses', () => {
    useExpenseStore.setState({
      budgets: [{ id: 'b1', name: 'Vacation', description: '', budget: 2000, color: '#FF6B9D', status: 'active', createdAt: '2026-08-01' }],
      expenses: [
        { id: 'e1', amount: 100, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false, projectId: 'b1', isPending: true },
        { id: 'e2', amount: 50, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false },
      ],
    });

    useExpenseStore.getState().deleteBudget('b1');

    expect(useExpenseStore.getState().budgets).toHaveLength(0);
    const e1 = useExpenseStore.getState().expenses.find((e) => e.id === 'e1')!;
    expect(e1.projectId).toBeUndefined();
    expect(e1.isPending).toBe(false);
  });

  it('addBudgetWithId restores with specific ID', () => {
    const budget = { id: 'restored-b1', name: 'Restored', description: '', budget: 1000, color: '#6C63FF', status: 'active' as const, createdAt: '2026-08-01' };
    useExpenseStore.getState().addBudgetWithId(budget);

    expect(useExpenseStore.getState().budgets[0].id).toBe('restored-b1');
  });
});

describe('Budget computed values', () => {
  it('getBudgetExpenses returns expenses linked to budget', () => {
    useExpenseStore.setState({
      expenses: [
        { id: 'e1', amount: 100, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false, projectId: 'b1' },
        { id: 'e2', amount: 50, category: 'Food', description: '', date: '2026-08-16T12:00:00.000Z', isFixed: false },
        { id: 'e3', amount: 75, category: 'Food', description: '', date: '2026-08-14T12:00:00.000Z', isFixed: false, projectId: 'b1' },
      ],
    });

    const budgetExpenses = useExpenseStore.getState().getBudgetExpenses('b1');
    expect(budgetExpenses).toHaveLength(2);
    // Sorted by date descending
    expect(budgetExpenses[0].id).toBe('e1');
    expect(budgetExpenses[1].id).toBe('e3');
  });

  it('getBudgetTotal sums committed (non-pending) expenses', () => {
    useExpenseStore.setState({
      expenses: [
        { id: 'e1', amount: 100, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false, projectId: 'b1' },
        { id: 'e2', amount: 200, category: 'Food', description: '', date: '2026-08-16T12:00:00.000Z', isFixed: false, projectId: 'b1', isPending: true },
        { id: 'e3', amount: 50, category: 'Food', description: '', date: '2026-08-14T12:00:00.000Z', isFixed: false, projectId: 'b1' },
      ],
    });

    expect(useExpenseStore.getState().getBudgetTotal('b1')).toBe(150); // 100 + 50, excludes pending
  });

  it('getBudgetPendingTotal sums pending expenses', () => {
    useExpenseStore.setState({
      expenses: [
        { id: 'e1', amount: 100, category: 'Food', description: '', date: '2026-08-15T12:00:00.000Z', isFixed: false, projectId: 'b1' },
        { id: 'e2', amount: 200, category: 'Food', description: '', date: '2026-08-16T12:00:00.000Z', isFixed: false, projectId: 'b1', isPending: true },
      ],
    });

    expect(useExpenseStore.getState().getBudgetPendingTotal('b1')).toBe(200);
  });
});

describe('Budget Templates', () => {
  it('adds a template', () => {
    useExpenseStore.getState().addBudgetTemplate({
      name: 'Monthly Groceries',
      description: 'Food budget',
      budget: 500,
      color: '#FF6B6B',
      icon: 'restaurant',
    });

    expect(useExpenseStore.getState().budgetTemplates).toHaveLength(1);
    expect(useExpenseStore.getState().budgetTemplates[0].name).toBe('Monthly Groceries');
  });

  it('creates budget from template', () => {
    useExpenseStore.setState({
      budgetTemplates: [{
        id: 't1',
        name: 'Travel Fund',
        description: 'For trips',
        budget: 3000,
        color: '#45B7D1',
        icon: 'flight',
        createdAt: '2026-08-01',
      }],
    });

    useExpenseStore.getState().createBudgetFromTemplate('t1');
    const budgets = useExpenseStore.getState().budgets;
    expect(budgets).toHaveLength(1);
    expect(budgets[0].name).toBe('Travel Fund');
    expect(budgets[0].budget).toBe(3000);
  });

  it('deletes a template', () => {
    useExpenseStore.setState({
      budgetTemplates: [{ id: 't1', name: 'Test', description: '', color: '#000', icon: 'star', createdAt: '2026-08-01' }],
    });

    useExpenseStore.getState().deleteBudgetTemplate('t1');
    expect(useExpenseStore.getState().budgetTemplates).toHaveLength(0);
  });
});
