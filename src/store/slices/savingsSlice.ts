import { StateCreator } from 'zustand';
import { SavingsGoal } from '../../types';
import { StoreState } from '../useExpenseStore';
import { uuidv4 } from '../utils';

export interface SavingsSlice {
  savingsGoals: SavingsGoal[];

  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  addSavingsGoalWithId: (goal: SavingsGoal) => void;
  updateSavingsGoal: (id: string, goal: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  addToSavingsGoal: (id: string, amount: number) => void;
  processAutoContributions: () => number;
}

export const createSavingsSlice: StateCreator<StoreState, [], [], SavingsSlice> = (set, get) => ({
  savingsGoals: [],

  addSavingsGoal: (goal) => {
    const now = new Date().toISOString();
    set((state) => ({
      savingsGoals: [
        { ...goal, id: uuidv4(), createdAt: now, updatedAt: now },
        ...state.savingsGoals,
      ],
    }));
  },

  addSavingsGoalWithId: (goal) =>
    set((state) => ({
      savingsGoals: [goal, ...state.savingsGoals.filter((g) => g.id !== goal.id)],
    })),

  updateSavingsGoal: (id, updates) =>
    set((state) => ({
      savingsGoals: state.savingsGoals.map((g) =>
        g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
      ),
    })),

  deleteSavingsGoal: (id) =>
    set((state) => ({
      savingsGoals: state.savingsGoals.filter((g) => g.id !== id),
    })),

  addToSavingsGoal: (id, amount) =>
    set((state) => ({
      savingsGoals: state.savingsGoals.map((g) =>
        g.id === id ? { ...g, currentAmount: g.currentAmount + amount, updatedAt: new Date().toISOString() } : g
      ),
    })),

  processAutoContributions: () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let count = 0;
    set((state) => ({
      savingsGoals: state.savingsGoals.map((g) => {
        const monthly = g.autoContributionMonthly || 0;
        if (monthly <= 0) return g;
        if (g.lastAutoContribution === currentMonth) return g;
        if (g.currentAmount >= g.targetAmount) return g;
        const remaining = g.targetAmount - g.currentAmount;
        const add = Math.min(monthly, remaining);
        count++;
        return {
          ...g,
          currentAmount: g.currentAmount + add,
          lastAutoContribution: currentMonth,
        };
      }),
    }));
    return count;
  },
});
