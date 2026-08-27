import { StateCreator } from 'zustand';
import { Budget, BudgetTemplate, Expense } from '../../types';
import { StoreState } from '../useExpenseStore';
import { uuidv4 } from '../utils';

export interface BudgetSlice {
  budgets: Budget[];
  budgetTemplates: BudgetTemplate[];

  addBudget: (budget: Omit<Budget, 'id' | 'createdAt'>) => void;
  addBudgetWithId: (budget: Budget) => void;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  getBudgetExpenses: (budgetId: string) => import('../../types').Expense[];
  getBudgetTotal: (budgetId: string) => number;
  getBudgetPendingTotal: (budgetId: string) => number;

  addBudgetTemplate: (template: Omit<BudgetTemplate, 'id' | 'createdAt'>) => void;
  deleteBudgetTemplate: (id: string) => void;
  createBudgetFromTemplate: (templateId: string) => void;

  importSharedBudget: (budget: Budget, expenses: Expense[]) => void;
}

export const createBudgetSlice: StateCreator<StoreState, [], [], BudgetSlice> = (set, get) => ({
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

  budgetTemplates: [],

  addBudget: (budget) =>
    set((state) => ({
      budgets: [
        { ...budget, id: uuidv4(), createdAt: new Date().toISOString() },
        ...state.budgets,
      ],
    })),

  addBudgetWithId: (budget) =>
    set((state) => ({
      budgets: [budget, ...state.budgets.filter((b) => b.id !== budget.id)],
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

  getBudgetExpenses: (budgetId) => {
    const { expenses } = get();
    return expenses
      .filter((e) => e.projectId === budgetId || (e.splits && e.splits.some((s) => s.projectId === budgetId)))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getBudgetTotal: (budgetId) => {
    const budgetExpenses = get().getBudgetExpenses(budgetId);
    const convert = get().convertToBase;
    return budgetExpenses
      .filter((e) => !e.isPending)
      .reduce((sum, e) => {
        if (e.splits && e.splits.length > 0) {
          return sum + e.splits
            .filter((s) => s.projectId === budgetId)
            .reduce((s2, s) => s2 + convert(s.amount, e.currency), 0)
            + (e.projectId === budgetId
              ? e.splits.filter((s) => !s.projectId).reduce((s2, s) => s2 + convert(s.amount, e.currency), 0)
              : 0);
        }
        return e.projectId === budgetId ? sum + convert(e.amount, e.currency) : sum;
      }, 0);
  },

  getBudgetPendingTotal: (budgetId) => {
    const budgetExpenses = get().getBudgetExpenses(budgetId);
    const convert = get().convertToBase;
    return budgetExpenses
      .filter((e) => e.isPending)
      .reduce((sum, e) => {
        if (e.splits && e.splits.length > 0) {
          return sum + e.splits
            .filter((s) => s.projectId === budgetId)
            .reduce((s2, s) => s2 + convert(s.amount, e.currency), 0)
            + (e.projectId === budgetId
              ? e.splits.filter((s) => !s.projectId).reduce((s2, s) => s2 + convert(s.amount, e.currency), 0)
              : 0);
        }
        return e.projectId === budgetId ? sum + convert(e.amount, e.currency) : sum;
      }, 0);
  },

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

  importSharedBudget: (budget, expenses) => {
    // Generate a new budget ID to avoid collisions
    const newBudgetId = uuidv4();
    set((state) => {
      // Check if budget already exists (by name + color as heuristic)
      const exists = state.budgets.some(
        (b) => b.name === budget.name && b.color === budget.color
      );
      const newBudget: Budget = {
        ...budget,
        id: newBudgetId,
        status: 'active',
        createdAt: budget.createdAt || new Date().toISOString(),
      };
      // Remap expenses to new budget ID, generate new IDs to avoid collisions
      const newExpenses = expenses.map((e) => ({
        ...e,
        id: uuidv4(),
        projectId: newBudgetId,
      }));
      return {
        budgets: exists ? state.budgets : [newBudget, ...state.budgets],
        expenses: [...newExpenses, ...state.expenses],
      };
    });
  },
});
