import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense, FixedExpense, FixedIncome, Income, Budget, CustomCategory, ExchangeRate, SavingsGoal, BudgetTemplate, CategoryBudget, FREQUENCY_TO_MONTHLY, EXPENSE_CATEGORIES } from '../types';
import { Platform } from 'react-native';
import { ThemeMode } from '../constants/theme';

const uuidv4 = (): string => {
  if (Platform.OS === 'web') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
};

interface ExpenseState {
  expenses: Expense[];
  fixedExpenses: FixedExpense[];
  incomes: Income[];
  budgets: Budget[];
  customCategories: CustomCategory[];
  exchangeRates: ExchangeRate[];
  initialBalance: number; // starting balance before any tracking
  monthlyIncome: number; // user's monthly income
  currencySymbol: string; // e.g. $, €, £

  // Exchange Rate Actions
  addExchangeRate: (rate: ExchangeRate) => void;
  updateExchangeRate: (from: string, rate: number) => void;
  deleteExchangeRate: (from: string) => void;
  convertToBase: (amount: number, currency?: string) => number;

  // Expense Actions
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  markExpenseCompleted: (id: string) => void;

  // Fixed Expense Actions
  addFixedExpense: (expense: Omit<FixedExpense, 'id'>) => void;
  updateFixedExpense: (id: string, expense: Partial<FixedExpense>) => void;
  deleteFixedExpense: (id: string) => void;

  // Income Actions
  addIncome: (income: Omit<Income, 'id'>) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;
  deleteIncome: (id: string) => void;

  // Fixed Income Actions
  fixedIncomes: FixedIncome[];
  addFixedIncome: (income: Omit<FixedIncome, 'id'>) => void;
  updateFixedIncome: (id: string, income: Partial<FixedIncome>) => void;
  deleteFixedIncome: (id: string) => void;
  getFixedIncomesTotal: () => number;

  // Budget Actions
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt'>) => void;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  // Custom Categories
  addCustomCategory: (category: CustomCategory) => void;
  deleteCustomCategory: (name: string) => void;

  // Category Order
  categoryOrder: string[];
  setCategoryOrder: (order: string[]) => void;
  getOrderedCategories: () => string[];

  // Category Budgets
  categoryBudgets: CategoryBudget[];
  setCategoryBudget: (category: string, monthlyLimit: number) => void;
  removeCategoryBudget: (category: string) => void;
  toggleCategoryBudget: (category: string) => void;
  getCategoryBudgetStatus: (month: string) => Array<{
    category: string;
    limit: number;
    spent: number;
    percentage: number;
    enabled: boolean;
  }>;

  // App Settings
  themeMode: ThemeMode;
  biometricEnabled: boolean;
  onboardingCompleted: boolean;

  // Settings
  setInitialBalance: (amount: number) => void;
  setMonthlyIncome: (amount: number) => void;
  setCurrencySymbol: (symbol: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;

  // Computed
  getMonthlyExpenses: (month: string) => Expense[];
  getMonthlyTotal: (month: string) => number;
  getFixedExpensesTotal: () => number;
  getMonthlyIncomes: (month: string) => Income[];
  getMonthlyExtraIncome: (month: string) => number;
  getMonthlyBalance: (month: string) => number;
  getOverallBalance: () => number;
  getTotalExpensesAllTime: () => number;
  getTotalExtraIncomeAllTime: () => number;
  getCategoryTotals: (month: string) => Record<string, number>;
  getAllTimeCategoryTotals: () => Record<string, number>;
  getTrackedMonths: () => string[];
  getBudgetExpenses: (budgetId: string) => Expense[];
  getBudgetTotal: (budgetId: string) => number;
  getBudgetPendingTotal: (budgetId: string) => number;

  // Savings Goals
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  updateSavingsGoal: (id: string, goal: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  addToSavingsGoal: (id: string, amount: number) => void;

  // Budget Templates
  budgetTemplates: BudgetTemplate[];
  addBudgetTemplate: (template: Omit<BudgetTemplate, 'id' | 'createdAt'>) => void;
  deleteBudgetTemplate: (id: string) => void;
  createBudgetFromTemplate: (templateId: string) => void;

  // Trends
  getMonthlyTotalsHistory: () => { month: string; expenses: number; income: number }[];
  getMonthlyCategoryHistory: () => { month: string; categories: Record<string, number> }[];

  // Backup / Restore
  restoreFromBackup: (data: {
    expenses: Expense[];
    fixedExpenses: FixedExpense[];
    incomes: Income[];
    fixedIncomes: FixedIncome[];
    budgets: Budget[];
    customCategories: CustomCategory[];
    exchangeRates: ExchangeRate[];
    savingsGoals: SavingsGoal[];
    budgetTemplates: BudgetTemplate[];
    categoryBudgets?: CategoryBudget[];
    initialBalance: number;
    monthlyIncome: number;
    currencySymbol: string;
  }) => void;
  getBackupState: () => {
    expenses: Expense[];
    fixedExpenses: FixedExpense[];
    incomes: Income[];
    fixedIncomes: FixedIncome[];
    budgets: Budget[];
    customCategories: CustomCategory[];
    exchangeRates: ExchangeRate[];
    savingsGoals: SavingsGoal[];
    budgetTemplates: BudgetTemplate[];
    categoryBudgets: CategoryBudget[];
    initialBalance: number;
    monthlyIncome: number;
    currencySymbol: string;
  };
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
  expenses: [
    {
      id: '1',
      amount: 45.99,
      category: 'Food',
      description: 'Grocery shopping',
      date: new Date().toISOString(),
      isFixed: false,
    },
    {
      id: '2',
      amount: 12.50,
      category: 'Transport',
      description: 'Bus pass top-up',
      date: new Date().toISOString(),
      isFixed: false,
    },
    {
      id: '3',
      amount: 89.00,
      category: 'Entertainment',
      description: 'Concert tickets',
      date: new Date(Date.now() - 86400000).toISOString(),
      isFixed: false,
    },
    {
      id: '4',
      amount: 25.00,
      category: 'Shopping',
      description: 'New book',
      date: new Date(Date.now() - 172800000).toISOString(),
      isFixed: false,
    },
    {
      id: '5',
      amount: 150.00,
      category: 'Health',
      description: 'Gym membership',
      date: new Date(Date.now() - 259200000).toISOString(),
      isFixed: false,
    },
    {
      id: '6',
      amount: 8500.00,
      category: 'Housing',
      description: 'Foundation materials',
      date: new Date(Date.now() - 432000000).toISOString(),
      isFixed: false,
      projectId: 'p1',
    },
    {
      id: '7',
      amount: 3200.00,
      category: 'Housing',
      description: 'Electrician labor',
      date: new Date(Date.now() - 345600000).toISOString(),
      isFixed: false,
      projectId: 'p1',
    },
    {
      id: '8',
      amount: 1450.00,
      category: 'Housing',
      description: 'Plumbing supplies',
      date: new Date(Date.now() - 172800000).toISOString(),
      isFixed: false,
      projectId: 'p1',
    },
  ],
  fixedExpenses: [
    { id: 'f1', amount: 1200, category: 'Housing', description: 'Rent' },
    { id: 'f2', amount: 15.99, category: 'Subscriptions', description: 'Netflix' },
    { id: 'f3', amount: 49.99, category: 'Bills', description: 'Internet' },
  ],
  budgets: [
    {
      id: 'p1',
      name: 'Building a House',
      description: 'New family home construction',
      budget: 50000,
      color: '#45B7D1',
      status: 'active',
      createdAt: new Date(Date.now() - 2592000000).toISOString(),
    },
    {
      id: 'p2',
      name: 'Home Office Setup',
      description: 'Desk, chair, monitors, and accessories',
      budget: 2500,
      color: '#6C63FF',
      status: 'active',
      createdAt: new Date(Date.now() - 604800000).toISOString(),
    },
  ],
  incomes: [],
  customCategories: [],
  categoryOrder: [],
  initialBalance: 5000,
  monthlyIncome: 3000,
  currencySymbol: '$',
  exchangeRates: [],
  categoryBudgets: [],
  themeMode: 'dark' as ThemeMode,
  biometricEnabled: false,
  onboardingCompleted: false,

  // Exchange Rate Actions
  addExchangeRate: (rate) =>
    set((state) => ({
      exchangeRates: [...state.exchangeRates.filter((r) => r.from !== rate.from), rate],
    })),

  updateExchangeRate: (from, rate) =>
    set((state) => ({
      exchangeRates: state.exchangeRates.map((r) =>
        r.from === from ? { ...r, rate } : r
      ),
    })),

  deleteExchangeRate: (from) =>
    set((state) => ({
      exchangeRates: state.exchangeRates.filter((r) => r.from !== from),
    })),

  convertToBase: (amount, currency) => {
    if (!currency) return amount;
    const { exchangeRates } = get();
    const rate = exchangeRates.find((r) => r.from === currency);
    return rate ? amount * rate.rate : amount;
  },

  // Expense Actions
  addExpense: (expense) =>
    set((state) => ({
      expenses: [{ ...expense, id: uuidv4() }, ...state.expenses],
    })),

  updateExpense: (id, updates) =>
    set((state) => ({
      expenses: state.expenses.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),

  deleteExpense: (id) =>
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    })),

  markExpenseCompleted: (id) =>
    set((state) => ({
      expenses: state.expenses.map((e) =>
        e.id === id ? { ...e, isPending: false } : e
      ),
    })),

  // Fixed Expense Actions
  addFixedExpense: (expense) =>
    set((state) => ({
      fixedExpenses: [{ ...expense, id: uuidv4() }, ...state.fixedExpenses],
    })),

  updateFixedExpense: (id, updates) =>
    set((state) => ({
      fixedExpenses: state.fixedExpenses.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),

  deleteFixedExpense: (id) =>
    set((state) => ({
      fixedExpenses: state.fixedExpenses.filter((e) => e.id !== id),
    })),

  // Income Actions
  addIncome: (income) =>
    set((state) => ({
      incomes: [{ ...income, id: uuidv4() }, ...state.incomes],
    })),

  updateIncome: (id, updates) =>
    set((state) => ({
      incomes: state.incomes.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    })),

  deleteIncome: (id) =>
    set((state) => ({
      incomes: state.incomes.filter((i) => i.id !== id),
    })),

  // Fixed Income Actions
  fixedIncomes: [],

  addFixedIncome: (income) =>
    set((state) => ({
      fixedIncomes: [{ ...income, id: uuidv4() }, ...state.fixedIncomes],
    })),

  updateFixedIncome: (id, updates) =>
    set((state) => ({
      fixedIncomes: state.fixedIncomes.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    })),

  deleteFixedIncome: (id) =>
    set((state) => ({
      fixedIncomes: state.fixedIncomes.filter((i) => i.id !== id),
    })),

  getFixedIncomesTotal: () => {
    const { fixedIncomes } = get();
    return fixedIncomes.reduce((sum, i) => {
      const multiplier = FREQUENCY_TO_MONTHLY[i.frequency || 'monthly'];
      return sum + i.amount * multiplier;
    }, 0);
  },

  // Budget Actions
  addBudget: (budget) =>
    set((state) => ({
      budgets: [
        { ...budget, id: uuidv4(), createdAt: new Date().toISOString() },
        ...state.budgets,
      ],
    })),

  updateBudget: (id, updates) =>
    set((state) => ({
      budgets: state.budgets.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  deleteBudget: (id) =>
    set((state) => ({
      budgets: state.budgets.filter((p) => p.id !== id),
      expenses: state.expenses.map((e) =>
        e.projectId === id ? { ...e, projectId: undefined, isPending: false } : e
      ),
    })),

  // Custom Categories
  addCustomCategory: (category) =>
    set((state) => ({
      customCategories: [...state.customCategories, category],
    })),

  deleteCustomCategory: (name) =>
    set((state) => ({
      customCategories: state.customCategories.filter((c) => c.name !== name),
      categoryOrder: state.categoryOrder.filter((n) => n !== name),
    })),

  // Category Order
  setCategoryOrder: (order) => set({ categoryOrder: order }),

  getOrderedCategories: () => {
    const { categoryOrder, customCategories } = get();
    const allNames = [
      ...EXPENSE_CATEGORIES,
      ...customCategories.map((c) => c.name),
    ];
    if (categoryOrder.length === 0) return allNames;
    // Put saved order first, then any new categories not yet in the order
    const ordered = categoryOrder.filter((n) => allNames.includes(n));
    const remaining = allNames.filter((n) => !ordered.includes(n));
    return [...ordered, ...remaining];
  },

  // Category Budgets
  setCategoryBudget: (category, monthlyLimit) =>
    set((state) => {
      const existing = state.categoryBudgets.find((b) => b.category === category);
      if (existing) {
        return {
          categoryBudgets: state.categoryBudgets.map((b) =>
            b.category === category ? { ...b, monthlyLimit } : b
          ),
        };
      }
      return {
        categoryBudgets: [...state.categoryBudgets, { category, monthlyLimit, enabled: true }],
      };
    }),

  removeCategoryBudget: (category) =>
    set((state) => ({
      categoryBudgets: state.categoryBudgets.filter((b) => b.category !== category),
    })),

  toggleCategoryBudget: (category) =>
    set((state) => ({
      categoryBudgets: state.categoryBudgets.map((b) =>
        b.category === category ? { ...b, enabled: !b.enabled } : b
      ),
    })),

  getCategoryBudgetStatus: (month) => {
    const { categoryBudgets, fixedExpenses } = get();
    const monthlyExpenses = get().getMonthlyExpenses(month);
    const convert = get().convertToBase;

    return categoryBudgets.map((cb) => {
      let spent = 0;
      monthlyExpenses.forEach((e) => {
        if (e.category === cb.category) {
          spent += convert(e.amount, e.currency);
        }
      });
      fixedExpenses.forEach((e) => {
        if (e.category === cb.category) {
          const multiplier = FREQUENCY_TO_MONTHLY[e.frequency || 'monthly'];
          spent += e.amount * multiplier;
        }
      });
      return {
        category: cb.category,
        limit: cb.monthlyLimit,
        spent,
        percentage: cb.monthlyLimit > 0 ? spent / cb.monthlyLimit : 0,
        enabled: cb.enabled,
      };
    });
  },

  // Settings
  setInitialBalance: (amount) => set({ initialBalance: amount }),
  setMonthlyIncome: (amount) => set({ monthlyIncome: amount }),
  setCurrencySymbol: (symbol) => set({ currencySymbol: symbol }),
  setThemeMode: (mode) => set({ themeMode: mode }),
  setBiometricEnabled: (enabled) => set({ biometricEnabled: enabled }),
  setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),

  // Computed
  getMonthlyExpenses: (month) => {
    const { expenses } = get();
    return expenses.filter((e) => e.date.substring(0, 7) === month);
  },

  getMonthlyTotal: (month) => {
    const monthlyExpenses = get().getMonthlyExpenses(month);
    const convert = get().convertToBase;
    return monthlyExpenses.reduce((sum, e) => sum + convert(e.amount, e.currency), 0);
  },

  getFixedExpensesTotal: () => {
    const { fixedExpenses } = get();
    return fixedExpenses.reduce((sum, e) => {
      const multiplier = FREQUENCY_TO_MONTHLY[e.frequency || 'monthly'];
      return sum + e.amount * multiplier;
    }, 0);
  },

  getMonthlyIncomes: (month) => {
    const { incomes } = get();
    return incomes.filter((i) => i.date.substring(0, 7) === month);
  },

  getMonthlyExtraIncome: (month) => {
    const monthlyIncomes = get().getMonthlyIncomes(month);
    return monthlyIncomes.reduce((sum, i) => sum + i.amount, 0);
  },

  // Monthly balance = income + fixed income + extra income - expenses - fixed expenses for that month
  getMonthlyBalance: (month) => {
    const { monthlyIncome } = get();
    const monthlyTotal = get().getMonthlyTotal(month);
    const fixedTotal = get().getFixedExpensesTotal();
    const fixedIncomeTotal = get().getFixedIncomesTotal();
    const extraIncome = get().getMonthlyExtraIncome(month);
    return monthlyIncome + fixedIncomeTotal + extraIncome - monthlyTotal - fixedTotal;
  },

  // Overall balance = initial balance + (income + fixed income + extra - expenses - fixed) for each tracked month
  getOverallBalance: () => {
    const { initialBalance, monthlyIncome } = get();
    const months = get().getTrackedMonths();
    const fixedTotal = get().getFixedExpensesTotal();
    const fixedIncomeTotal = get().getFixedIncomesTotal();

    let total = initialBalance;
    months.forEach((month) => {
      const monthExpenses = get().getMonthlyTotal(month);
      const extraIncome = get().getMonthlyExtraIncome(month);
      total += monthlyIncome + fixedIncomeTotal + extraIncome - monthExpenses - fixedTotal;
    });
    return total;
  },

  getTotalExpensesAllTime: () => {
    const { expenses } = get();
    const convert = get().convertToBase;
    return expenses.reduce((sum, e) => sum + convert(e.amount, e.currency), 0);
  },

  getTotalExtraIncomeAllTime: () => {
    const { incomes } = get();
    return incomes.reduce((sum, i) => sum + i.amount, 0);
  },

  getCategoryTotals: (month) => {
    const monthlyExpenses = get().getMonthlyExpenses(month);
    const convert = get().convertToBase;
    const totals: Record<string, number> = {};
    monthlyExpenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + convert(e.amount, e.currency);
    });
    const { fixedExpenses } = get();
    fixedExpenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return totals;
  },

  getAllTimeCategoryTotals: () => {
    const { expenses, fixedExpenses } = get();
    const months = get().getTrackedMonths();
    const convert = get().convertToBase;
    const totals: Record<string, number> = {};
    expenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + convert(e.amount, e.currency);
    });
    // Add fixed expenses * number of tracked months
    fixedExpenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount * Math.max(months.length, 1);
    });
    return totals;
  },

  // Get unique months that have expenses or income
  getTrackedMonths: () => {
    const { expenses, incomes } = get();
    const months = new Set<string>();
    expenses.forEach((e) => {
      months.add(e.date.substring(0, 7));
    });
    incomes.forEach((i) => {
      months.add(i.date.substring(0, 7));
    });
    // Always include current month
    const now = new Date();
    months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    return Array.from(months).sort();
  },

  getBudgetExpenses: (budgetId) => {
    const { expenses } = get();
    return expenses
      .filter((e) => e.projectId === budgetId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getBudgetTotal: (budgetId) => {
    const budgetExpenses = get().getBudgetExpenses(budgetId);
    const convert = get().convertToBase;
    return budgetExpenses
      .filter((e) => !e.isPending)
      .reduce((sum, e) => sum + convert(e.amount, e.currency), 0);
  },

  getBudgetPendingTotal: (budgetId) => {
    const budgetExpenses = get().getBudgetExpenses(budgetId);
    const convert = get().convertToBase;
    return budgetExpenses
      .filter((e) => e.isPending)
      .reduce((sum, e) => sum + convert(e.amount, e.currency), 0);
  },

  // Savings Goals
  savingsGoals: [],

  addSavingsGoal: (goal) =>
    set((state) => ({
      savingsGoals: [
        { ...goal, id: uuidv4(), createdAt: new Date().toISOString() },
        ...state.savingsGoals,
      ],
    })),

  updateSavingsGoal: (id, updates) =>
    set((state) => ({
      savingsGoals: state.savingsGoals.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    })),

  deleteSavingsGoal: (id) =>
    set((state) => ({
      savingsGoals: state.savingsGoals.filter((g) => g.id !== id),
    })),

  addToSavingsGoal: (id, amount) =>
    set((state) => ({
      savingsGoals: state.savingsGoals.map((g) =>
        g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g
      ),
    })),

  // Budget Templates
  budgetTemplates: [],

  addBudgetTemplate: (template) =>
    set((state) => ({
      budgetTemplates: [
        { ...template, id: uuidv4(), createdAt: new Date().toISOString() },
        ...state.budgetTemplates,
      ],
    })),

  deleteBudgetTemplate: (id) =>
    set((state) => ({
      budgetTemplates: state.budgetTemplates.filter((t) => t.id !== id),
    })),

  createBudgetFromTemplate: (templateId) => {
    const { budgetTemplates } = get();
    const template = budgetTemplates.find((t) => t.id === templateId);
    if (!template) return;
    get().addBudget({
      name: template.name,
      description: template.description,
      budget: template.budget,
      color: template.color,
      status: 'active',
    });
  },

  // Trends
  getMonthlyTotalsHistory: () => {
    const months = get().getTrackedMonths();
    const { monthlyIncome } = get();
    const fixedTotal = get().getFixedExpensesTotal();
    const fixedIncomeTotal = get().getFixedIncomesTotal();
    return months.map((month) => {
      const expenses = get().getMonthlyTotal(month) + fixedTotal;
      const extraIncome = get().getMonthlyExtraIncome(month);
      const income = monthlyIncome + fixedIncomeTotal + extraIncome;
      return { month, expenses, income };
    });
  },

  getMonthlyCategoryHistory: () => {
    const months = get().getTrackedMonths();
    return months.map((month) => ({
      month,
      categories: get().getCategoryTotals(month),
    }));
  },

  // Backup / Restore
  restoreFromBackup: (data) =>
    set({
      expenses: data.expenses || [],
      fixedExpenses: data.fixedExpenses || [],
      incomes: data.incomes || [],
      fixedIncomes: data.fixedIncomes || [],
      budgets: data.budgets || [],
      customCategories: data.customCategories || [],
      exchangeRates: data.exchangeRates || [],
      savingsGoals: data.savingsGoals || [],
      budgetTemplates: data.budgetTemplates || [],
      categoryBudgets: data.categoryBudgets || [],
      initialBalance: data.initialBalance ?? 0,
      monthlyIncome: data.monthlyIncome ?? 0,
      currencySymbol: data.currencySymbol || '$',
    }),

  getBackupState: () => {
    const s = get();
    return {
      expenses: s.expenses,
      fixedExpenses: s.fixedExpenses,
      incomes: s.incomes,
      fixedIncomes: s.fixedIncomes,
      budgets: s.budgets,
      customCategories: s.customCategories,
      exchangeRates: s.exchangeRates,
      savingsGoals: s.savingsGoals,
      budgetTemplates: s.budgetTemplates,
      categoryBudgets: s.categoryBudgets,
      initialBalance: s.initialBalance,
      monthlyIncome: s.monthlyIncome,
      currencySymbol: s.currencySymbol,
    };
  },
    }),
    {
      name: 'expense-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        expenses: state.expenses,
        fixedExpenses: state.fixedExpenses,
        incomes: state.incomes,
        fixedIncomes: state.fixedIncomes,
        budgets: state.budgets,
        customCategories: state.customCategories,
        categoryOrder: state.categoryOrder,
        exchangeRates: state.exchangeRates,
        initialBalance: state.initialBalance,
        monthlyIncome: state.monthlyIncome,
        currencySymbol: state.currencySymbol,
        savingsGoals: state.savingsGoals,
        budgetTemplates: state.budgetTemplates,
        categoryBudgets: state.categoryBudgets,
        themeMode: state.themeMode,
        biometricEnabled: state.biometricEnabled,
        onboardingCompleted: state.onboardingCompleted,
      }),
      // Migrate old 'projects' key to 'budgets'
      migrate: (persistedState: any, version: number) => {
        if (persistedState.projects && !persistedState.budgets) {
          persistedState.budgets = persistedState.projects;
          delete persistedState.projects;
        }
        return persistedState;
      },
      version: 1,
    }
  )
);
