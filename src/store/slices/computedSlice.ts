import { StateCreator } from 'zustand';
import { Expense, FixedExpense, FixedIncome, Income, Budget, CustomCategory, ExchangeRate, SavingsGoal, BudgetTemplate, CategoryBudget, DashboardCardConfig, DEFAULT_DASHBOARD_CARDS, IncomeSource, YoYMonthData } from '../../types';
import { StoreState } from '../useExpenseStore';
import { computeDueDates, generateRecurringId } from '../../utils/recurringProcessor';

export interface ComputedSlice {
  getMonthlyBalance: (month: string) => number;
  getOverallBalance: () => number;
  getTrackedMonths: () => string[];
  getMonthlyTotalsHistory: () => { month: string; expenses: number; income: number }[];
  getMonthlyCategoryHistory: () => { month: string; categories: Record<string, number> }[];
  getYearOverYearData: () => YoYMonthData[];
  processRecurringExpenses: () => void;
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
    dashboardCards?: DashboardCardConfig[];
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
    dashboardCards: DashboardCardConfig[];
    initialBalance: number;
    monthlyIncome: number;
    currencySymbol: string;
  };
}

export const createComputedSlice: StateCreator<StoreState, [], [], ComputedSlice> = (set, get) => ({
  getMonthlyBalance: (month) => {
    const { monthlyIncome } = get();
    const monthlyTotal = get().getMonthlyTotal(month);
    const fixedTotal = get().getFixedExpensesTotal();
    const fixedIncomeTotal = get().getFixedIncomesTotal();
    const extraIncome = get().getMonthlyExtraIncome(month);
    return monthlyIncome + fixedIncomeTotal + extraIncome - monthlyTotal - fixedTotal;
  },

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

  getTrackedMonths: () => {
    const { expenses, incomes } = get();
    const months = new Set<string>();
    expenses.forEach((e) => {
      months.add(e.date.substring(0, 7));
    });
    incomes.forEach((i) => {
      months.add(i.date.substring(0, 7));
    });
    const now = new Date();
    months.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    return Array.from(months).sort();
  },

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

  getYearOverYearData: () => {
    const history = get().getMonthlyTotalsHistory();
    const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const byMonth: Record<number, { year: number; expenses: number; income: number }[]> = {};

    history.forEach(({ month, expenses, income }) => {
      const [yearStr, monthStr] = month.split('-');
      const monthIndex = parseInt(monthStr, 10) - 1;
      const year = parseInt(yearStr, 10);
      if (!byMonth[monthIndex]) byMonth[monthIndex] = [];
      byMonth[monthIndex].push({ year, expenses, income });
    });

    return Object.keys(byMonth)
      .map(Number)
      .sort((a, b) => a - b)
      .map((monthIndex) => ({
        monthIndex,
        monthLabel: MONTH_LABELS[monthIndex],
        years: byMonth[monthIndex].sort((a, b) => a.year - b.year).slice(-3),
      }));
  },

  processRecurringExpenses: () => {
    const { fixedExpenses, fixedIncomes, expenses, incomes } = get();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const defaultStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const existingExpenseIds = new Set(expenses.map((e) => e.id));
    const existingIncomeIds = new Set(incomes.map((i) => i.id));

    const newExpenses: Expense[] = [];
    const updatedFixed = fixedExpenses.map((fe) => {
      if (fe.paused) return fe; // skip paused items
      const freq = fe.frequency || 'monthly';
      const start = fe.startDate || defaultStart;
      const dueDates = computeDueDates(freq, start, fe.lastProcessedDate, today);
      let lastDate = fe.lastProcessedDate;
      for (const dateStr of dueDates) {
        const id = generateRecurringId(fe.id, dateStr);
        if (!existingExpenseIds.has(id)) {
          newExpenses.push({
            id,
            amount: fe.amount,
            category: fe.category,
            description: fe.description,
            date: new Date(dateStr + 'T12:00:00').toISOString(),
            isFixed: true,
          });
          existingExpenseIds.add(id);
        }
        lastDate = dateStr;
      }
      if (lastDate !== fe.lastProcessedDate) {
        return { ...fe, lastProcessedDate: lastDate, startDate: fe.startDate || defaultStart };
      }
      if (!fe.startDate) {
        return { ...fe, startDate: defaultStart };
      }
      return fe;
    });

    const newIncomes: Income[] = [];
    const updatedFixedIncomes = fixedIncomes.map((fi) => {
      if (fi.paused) return fi; // skip paused items
      const freq = fi.frequency || 'monthly';
      const start = fi.startDate || defaultStart;
      const dueDates = computeDueDates(freq, start, fi.lastProcessedDate, today);
      let lastDate = fi.lastProcessedDate;
      for (const dateStr of dueDates) {
        const id = generateRecurringId(fi.id, dateStr);
        if (!existingIncomeIds.has(id)) {
          newIncomes.push({
            id,
            amount: fi.amount,
            source: fi.source as IncomeSource,
            description: fi.description,
            date: new Date(dateStr + 'T12:00:00').toISOString(),
          });
          existingIncomeIds.add(id);
        }
        lastDate = dateStr;
      }
      if (lastDate !== fi.lastProcessedDate) {
        return { ...fi, lastProcessedDate: lastDate, startDate: fi.startDate || defaultStart };
      }
      if (!fi.startDate) {
        return { ...fi, startDate: defaultStart };
      }
      return fi;
    });

    if (newExpenses.length > 0 || newIncomes.length > 0 || updatedFixed !== fixedExpenses || updatedFixedIncomes !== fixedIncomes) {
      set((state) => ({
        expenses: [...newExpenses, ...state.expenses],
        incomes: [...newIncomes, ...state.incomes],
        fixedExpenses: updatedFixed,
        fixedIncomes: updatedFixedIncomes,
      }));
    }
  },

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
      dashboardCards: data.dashboardCards || DEFAULT_DASHBOARD_CARDS,
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
      dashboardCards: s.dashboardCards,
      initialBalance: s.initialBalance,
      monthlyIncome: s.monthlyIncome,
      currencySymbol: s.currencySymbol,
    };
  },
});
