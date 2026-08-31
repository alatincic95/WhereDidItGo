import { StateCreator } from 'zustand';
import { Debt, PayoffStrategy } from '../../types';
import { StoreState } from '../useExpenseStore';
import { uuidv4 } from '../utils';

export interface DebtSlice {
  debts: Debt[];
  debtExtraPayment: number;      // extra monthly payment above minimums
  debtStrategy: PayoffStrategy;  // avalanche or snowball

  addDebt: (debt: Omit<Debt, 'id' | 'createdAt'>) => void;
  addDebtWithId: (debt: Debt) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  setDebtExtraPayment: (amount: number) => void;
  setDebtStrategy: (strategy: PayoffStrategy) => void;
  getTotalDebt: () => number;
  getTotalMinimumPayments: () => number;
}

export const createDebtSlice: StateCreator<StoreState, [], [], DebtSlice> = (set, get) => ({
  debts: [],
  debtExtraPayment: 0,
  debtStrategy: 'avalanche',

  addDebt: (debt) =>
    set((state) => ({
      debts: [
        { ...debt, id: uuidv4(), createdAt: new Date().toISOString() },
        ...state.debts,
      ],
    })),

  addDebtWithId: (debt) =>
    set((state) => ({
      debts: [debt, ...state.debts.filter((d) => d.id !== debt.id)],
    })),

  updateDebt: (id, updates) =>
    set((state) => ({
      debts: state.debts.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),

  deleteDebt: (id) =>
    set((state) => ({
      debts: state.debts.filter((d) => d.id !== id),
    })),

  setDebtExtraPayment: (amount) => set({ debtExtraPayment: amount }),

  setDebtStrategy: (strategy) => set({ debtStrategy: strategy }),

  getTotalDebt: () => get().debts.reduce((sum, d) => sum + d.balance, 0),

  getTotalMinimumPayments: () => get().debts.reduce((sum, d) => sum + d.minimumPayment, 0),
});
