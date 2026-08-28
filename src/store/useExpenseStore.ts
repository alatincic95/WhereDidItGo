import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_DASHBOARD_CARDS } from '../types';

import { ExpenseSlice, createExpenseSlice } from './slices/expenseSlice';
import { IncomeSlice, createIncomeSlice } from './slices/incomeSlice';
import { BudgetSlice, createBudgetSlice } from './slices/budgetSlice';
import { SavingsSlice, createSavingsSlice } from './slices/savingsSlice';
import { SettingsSlice, createSettingsSlice } from './slices/settingsSlice';
import { ComputedSlice, createComputedSlice } from './slices/computedSlice';

export type StoreState = ExpenseSlice &
  IncomeSlice &
  BudgetSlice &
  SavingsSlice &
  SettingsSlice &
  ComputedSlice;

export const useExpenseStore = create<StoreState>()(
  persist(
    (set, get, api) => ({
      ...createExpenseSlice(set, get, api),
      ...createIncomeSlice(set, get, api),
      ...createBudgetSlice(set, get, api),
      ...createSavingsSlice(set, get, api),
      ...createSettingsSlice(set, get, api),
      ...createComputedSlice(set, get, api),
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
        expenseTemplates: state.expenseTemplates,
        categoryBudgets: state.categoryBudgets,
        dashboardCards: state.dashboardCards,
        themeMode: state.themeMode,
        biometricEnabled: state.biometricEnabled,
        pushNotificationsEnabled: state.pushNotificationsEnabled,
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
