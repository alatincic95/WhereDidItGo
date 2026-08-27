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

describe('Savings Goals CRUD', () => {
  it('adds a savings goal', () => {
    useExpenseStore.getState().addSavingsGoal({
      name: 'Emergency Fund',
      targetAmount: 10000,
      currentAmount: 0,
      color: '#00D68F',
      icon: 'savings',
    });

    const goals = useExpenseStore.getState().savingsGoals;
    expect(goals).toHaveLength(1);
    expect(goals[0].name).toBe('Emergency Fund');
    expect(goals[0].targetAmount).toBe(10000);
    expect(goals[0].currentAmount).toBe(0);
    expect(goals[0].id).toBeDefined();
    expect(goals[0].createdAt).toBeDefined();
  });

  it('updates a savings goal', () => {
    useExpenseStore.setState({
      savingsGoals: [{
        id: 'g1', name: 'Emergency', targetAmount: 10000, currentAmount: 500,
        color: '#00D68F', icon: 'savings', createdAt: '2026-08-01',
      }],
    });

    useExpenseStore.getState().updateSavingsGoal('g1', { targetAmount: 15000 });
    expect(useExpenseStore.getState().savingsGoals[0].targetAmount).toBe(15000);
  });

  it('deletes a savings goal', () => {
    useExpenseStore.setState({
      savingsGoals: [{
        id: 'g1', name: 'Emergency', targetAmount: 10000, currentAmount: 0,
        color: '#00D68F', icon: 'savings', createdAt: '2026-08-01',
      }],
    });

    useExpenseStore.getState().deleteSavingsGoal('g1');
    expect(useExpenseStore.getState().savingsGoals).toHaveLength(0);
  });

  it('adds funds to a goal', () => {
    useExpenseStore.setState({
      savingsGoals: [{
        id: 'g1', name: 'Car', targetAmount: 5000, currentAmount: 1000,
        color: '#45B7D1', icon: 'directions-car', createdAt: '2026-08-01',
      }],
    });

    useExpenseStore.getState().addToSavingsGoal('g1', 500);
    expect(useExpenseStore.getState().savingsGoals[0].currentAmount).toBe(1500);

    useExpenseStore.getState().addToSavingsGoal('g1', 250);
    expect(useExpenseStore.getState().savingsGoals[0].currentAmount).toBe(1750);
  });
});

describe('Auto Contributions', () => {
  it('processes auto contributions for the current month', () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    useExpenseStore.setState({
      savingsGoals: [{
        id: 'g1', name: 'Fund', targetAmount: 5000, currentAmount: 1000,
        color: '#00D68F', icon: 'savings', createdAt: '2026-01-01',
        autoContributionMonthly: 200,
        // No lastAutoContribution set, so it should process
      }],
    });

    const count = useExpenseStore.getState().processAutoContributions();
    expect(count).toBe(1);

    const goal = useExpenseStore.getState().savingsGoals[0];
    expect(goal.currentAmount).toBe(1200);
    expect(goal.lastAutoContribution).toBe(currentMonth);
  });

  it('skips if already processed this month', () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    useExpenseStore.setState({
      savingsGoals: [{
        id: 'g1', name: 'Fund', targetAmount: 5000, currentAmount: 1000,
        color: '#00D68F', icon: 'savings', createdAt: '2026-01-01',
        autoContributionMonthly: 200,
        lastAutoContribution: currentMonth, // already done
      }],
    });

    const count = useExpenseStore.getState().processAutoContributions();
    expect(count).toBe(0);
    expect(useExpenseStore.getState().savingsGoals[0].currentAmount).toBe(1000);
  });

  it('caps contribution at remaining target', () => {
    useExpenseStore.setState({
      savingsGoals: [{
        id: 'g1', name: 'Fund', targetAmount: 1100, currentAmount: 1000,
        color: '#00D68F', icon: 'savings', createdAt: '2026-01-01',
        autoContributionMonthly: 200,
      }],
    });

    useExpenseStore.getState().processAutoContributions();
    expect(useExpenseStore.getState().savingsGoals[0].currentAmount).toBe(1100); // capped
  });

  it('skips goals that are already at target', () => {
    useExpenseStore.setState({
      savingsGoals: [{
        id: 'g1', name: 'Done', targetAmount: 1000, currentAmount: 1000,
        color: '#00D68F', icon: 'savings', createdAt: '2026-01-01',
        autoContributionMonthly: 200,
      }],
    });

    const count = useExpenseStore.getState().processAutoContributions();
    expect(count).toBe(0);
  });

  it('skips goals with no auto contribution configured', () => {
    useExpenseStore.setState({
      savingsGoals: [{
        id: 'g1', name: 'Manual', targetAmount: 5000, currentAmount: 1000,
        color: '#00D68F', icon: 'savings', createdAt: '2026-01-01',
      }],
    });

    const count = useExpenseStore.getState().processAutoContributions();
    expect(count).toBe(0);
  });
});
