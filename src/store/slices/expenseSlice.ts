import { StateCreator } from 'zustand';
import { Expense, FixedExpense, ExpenseTemplate, RecurringFrequency, FREQUENCY_TO_MONTHLY } from '../../types';
import { StoreState } from '../useExpenseStore';
import { uuidv4 } from '../utils';

export interface ExpenseSlice {
  expenses: Expense[];
  fixedExpenses: FixedExpense[];
  expenseTemplates: ExpenseTemplate[];

  addExpense: (expense: Omit<Expense, 'id'>) => void;
  addExpenseWithId: (expense: Expense) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  markExpenseCompleted: (id: string) => void;
  togglePinExpense: (id: string) => void;
  convertExpenseToRecurring: (id: string, frequency: RecurringFrequency) => void;
  getAllTags: () => string[];

  addFixedExpense: (expense: Omit<FixedExpense, 'id'>) => void;
  updateFixedExpense: (id: string, expense: Partial<FixedExpense>) => void;
  deleteFixedExpense: (id: string) => void;

  addExpenseTemplate: (template: Omit<ExpenseTemplate, 'id' | 'createdAt'>) => void;
  deleteExpenseTemplate: (id: string) => void;
  addExpenseFromTemplate: (templateId: string) => void;

  getMonthlyExpenses: (month: string) => Expense[];
  getMonthlyTotal: (month: string) => number;
  getFixedExpensesTotal: () => number;
  getCategoryTotals: (month: string) => Record<string, number>;
  getAllTimeCategoryTotals: () => Record<string, number>;
  getTotalExpensesAllTime: () => number;
}

export const createExpenseSlice: StateCreator<StoreState, [], [], ExpenseSlice> = (set, get) => ({
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

  expenseTemplates: [],

  addExpense: (expense) =>
    set((state) => ({
      expenses: [{ ...expense, id: uuidv4() }, ...state.expenses],
    })),

  addExpenseWithId: (expense) =>
    set((state) => ({
      expenses: [expense, ...state.expenses.filter((e) => e.id !== expense.id)],
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

  togglePinExpense: (id) =>
    set((state) => ({
      expenses: state.expenses.map((e) =>
        e.id === id ? { ...e, pinned: !e.pinned } : e
      ),
    })),

  convertExpenseToRecurring: (id, frequency) => {
    const { expenses } = get();
    const expense = expenses.find((e) => e.id === id);
    if (!expense) return;
    get().addFixedExpense({
      amount: expense.amount,
      category: expense.category,
      description: expense.description || expense.category,
      frequency,
    });
    get().deleteExpense(id);
  },

  getAllTags: () => {
    const { expenses } = get();
    const tagSet = new Set<string>();
    expenses.forEach((e) => (e.tags || []).forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  },

  addFixedExpense: (expense) =>
    set((state) => ({
      fixedExpenses: [{ ...expense, id: uuidv4(), startDate: new Date().toISOString().slice(0, 10) }, ...state.fixedExpenses],
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

  addExpenseTemplate: (template) =>
    set((state) => ({
      expenseTemplates: [
        { ...template, id: uuidv4(), createdAt: new Date().toISOString() },
        ...state.expenseTemplates,
      ],
    })),

  deleteExpenseTemplate: (id) =>
    set((state) => ({
      expenseTemplates: state.expenseTemplates.filter((t) => t.id !== id),
    })),

  addExpenseFromTemplate: (templateId) => {
    const { expenseTemplates } = get();
    const template = expenseTemplates.find((t) => t.id === templateId);
    if (!template) return;
    get().addExpense({
      amount: template.amount,
      category: template.category,
      description: template.description,
      date: new Date().toISOString(),
      isFixed: false,
      currency: template.currency,
      tags: template.tags,
    });
  },

  getMonthlyExpenses: (month) => {
    const { expenses, selectedAccountId, accounts } = get();
    let filtered = expenses.filter((e) => e.date.substring(0, 7) === month);
    if (selectedAccountId) {
      const isDefault = accounts.find((a) => a.id === selectedAccountId)?.isDefault;
      filtered = filtered.filter((e) =>
        e.accountId === selectedAccountId || (isDefault && !e.accountId)
      );
    }
    return filtered;
  },

  getMonthlyTotal: (month) => {
    const monthlyExpenses = get().getMonthlyExpenses(month);
    const convert = get().convertToBase;
    return monthlyExpenses.filter((e) => !e.isFixed).reduce((sum, e) => sum + convert(e.amount, e.currency), 0);
  },

  getFixedExpensesTotal: () => {
    const { fixedExpenses } = get();
    return fixedExpenses.filter((e) => !e.paused).reduce((sum, e) => {
      const multiplier = FREQUENCY_TO_MONTHLY[e.frequency || 'monthly'];
      return sum + e.amount * multiplier;
    }, 0);
  },

  getCategoryTotals: (month) => {
    const monthlyExpenses = get().getMonthlyExpenses(month);
    const convert = get().convertToBase;
    const totals: Record<string, number> = {};
    monthlyExpenses.filter((e) => !e.isFixed).forEach((e) => {
      if (e.splits && e.splits.length > 0) {
        e.splits.forEach((s) => {
          totals[s.category] = (totals[s.category] || 0) + convert(s.amount, e.currency);
        });
      } else {
        totals[e.category] = (totals[e.category] || 0) + convert(e.amount, e.currency);
      }
    });
    const { fixedExpenses } = get();
    fixedExpenses.filter((e) => !e.paused).forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return totals;
  },

  getAllTimeCategoryTotals: () => {
    const { expenses, fixedExpenses, selectedAccountId, accounts } = get();
    const months = get().getTrackedMonths();
    const convert = get().convertToBase;
    const totals: Record<string, number> = {};
    const isDefaultSelected = selectedAccountId ? accounts.find((a) => a.id === selectedAccountId)?.isDefault : false;
    const matchAccount = (e: { accountId?: string }) =>
      !selectedAccountId || e.accountId === selectedAccountId || (isDefaultSelected && !e.accountId);
    expenses.filter((e) => !e.isFixed && matchAccount(e)).forEach((e) => {
      if (e.splits && e.splits.length > 0) {
        e.splits.forEach((s) => {
          totals[s.category] = (totals[s.category] || 0) + convert(s.amount, e.currency);
        });
      } else {
        totals[e.category] = (totals[e.category] || 0) + convert(e.amount, e.currency);
      }
    });
    fixedExpenses.filter((e) => !e.paused).forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount * Math.max(months.length, 1);
    });
    return totals;
  },

  getTotalExpensesAllTime: () => {
    const { expenses, selectedAccountId, accounts } = get();
    const convert = get().convertToBase;
    const isDefaultSelected = selectedAccountId ? accounts.find((a) => a.id === selectedAccountId)?.isDefault : false;
    return expenses.filter((e) => {
      if (e.isFixed) return false;
      if (!selectedAccountId) return true;
      return e.accountId === selectedAccountId || (isDefaultSelected && !e.accountId);
    }).reduce((sum, e) => sum + convert(e.amount, e.currency), 0);
  },
});
