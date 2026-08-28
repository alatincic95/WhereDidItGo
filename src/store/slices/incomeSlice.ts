import { StateCreator } from 'zustand';
import { Income, FixedIncome, RecurringFrequency, FREQUENCY_TO_MONTHLY } from '../../types';
import { StoreState } from '../useExpenseStore';
import { uuidv4 } from '../utils';

export interface IncomeSlice {
  incomes: Income[];
  fixedIncomes: FixedIncome[];

  addIncome: (income: Omit<Income, 'id'>) => void;
  addIncomeWithId: (income: Income) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;
  deleteIncome: (id: string) => void;

  addFixedIncome: (income: Omit<FixedIncome, 'id'>) => void;
  updateFixedIncome: (id: string, income: Partial<FixedIncome>) => void;
  deleteFixedIncome: (id: string) => void;
  getFixedIncomesTotal: () => number;
  convertIncomeToRecurring: (id: string, frequency: RecurringFrequency) => void;

  getMonthlyIncomes: (month: string) => Income[];
  getMonthlyExtraIncome: (month: string) => number;
  getTotalExtraIncomeAllTime: () => number;
}

export const createIncomeSlice: StateCreator<StoreState, [], [], IncomeSlice> = (set, get) => ({
  incomes: [],
  fixedIncomes: [],

  addIncome: (income) =>
    set((state) => ({
      incomes: [{ ...income, id: uuidv4() }, ...state.incomes],
    })),

  addIncomeWithId: (income) =>
    set((state) => ({
      incomes: [income, ...state.incomes.filter((i) => i.id !== income.id)],
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

  addFixedIncome: (income) =>
    set((state) => ({
      fixedIncomes: [{ ...income, id: uuidv4(), startDate: new Date().toISOString().slice(0, 10) }, ...state.fixedIncomes],
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

  convertIncomeToRecurring: (id, frequency) => {
    const { incomes } = get();
    const income = incomes.find((i) => i.id === id);
    if (!income) return;
    get().addFixedIncome({
      amount: income.amount,
      source: income.source,
      description: income.description || income.source,
      frequency,
    });
    get().deleteIncome(id);
  },

  getFixedIncomesTotal: () => {
    const { fixedIncomes } = get();
    return fixedIncomes.filter((i) => !i.paused).reduce((sum, i) => {
      const multiplier = FREQUENCY_TO_MONTHLY[i.frequency || 'monthly'];
      return sum + i.amount * multiplier;
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

  getTotalExtraIncomeAllTime: () => {
    const { incomes } = get();
    return incomes.reduce((sum, i) => sum + i.amount, 0);
  },
});
