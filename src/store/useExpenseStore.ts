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
import { AccountSlice, createAccountSlice } from './slices/accountSlice';
import { CryptoSlice, createCryptoSlice } from './slices/cryptoSlice';
import { DebtSlice, createDebtSlice } from './slices/debtSlice';
import { NetWorthSlice, createNetWorthSlice } from './slices/netWorthSlice';
import { AuthSlice, createAuthSlice } from './slices/authSlice';

export type StoreState = ExpenseSlice &
  IncomeSlice &
  BudgetSlice &
  SavingsSlice &
  SettingsSlice &
  ComputedSlice &
  AccountSlice &
  CryptoSlice &
  DebtSlice &
  NetWorthSlice &
  AuthSlice;

export const useExpenseStore = create<StoreState>()(
  persist(
    (set, get, api) => ({
      ...createExpenseSlice(set, get, api),
      ...createIncomeSlice(set, get, api),
      ...createBudgetSlice(set, get, api),
      ...createSavingsSlice(set, get, api),
      ...createSettingsSlice(set, get, api),
      ...createComputedSlice(set, get, api),
      ...createAccountSlice(set, get, api),
      ...createCryptoSlice(set, get, api),
      ...createDebtSlice(set, get, api),
      ...createNetWorthSlice(set, get, api),
      ...createAuthSlice(set, get, api),
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
        accounts: state.accounts,
        transfers: state.transfers,
        useRecurringAsMonthlyIncome: state.useRecurringAsMonthlyIncome,
        reminderLeadDays: state.reminderLeadDays,
        autoBackupEnabled: state.autoBackupEnabled,
        autoBackupFrequency: state.autoBackupFrequency,
        autoBackupMaxCount: state.autoBackupMaxCount,
        cryptoHoldings: state.cryptoHoldings,
        cryptoPrices: state.cryptoPrices,
        cryptoLastFetched: state.cryptoLastFetched,
        cryptoIncludeInBalance: state.cryptoIncludeInBalance,
        debts: state.debts,
        debtExtraPayment: state.debtExtraPayment,
        debtStrategy: state.debtStrategy,
        netWorthItems: state.netWorthItems,
        netWorthSnapshots: state.netWorthSnapshots,
        userId: state.userId,
        userEmail: state.userEmail,
      }),
      migrate: (persistedState: any, version: number) => {
        // v0 → v1: rename projects to budgets
        if (persistedState.projects && !persistedState.budgets) {
          persistedState.budgets = persistedState.projects;
          delete persistedState.projects;
        }
        // v1 → v2: new features defaults
        if (version < 2) {
          if (persistedState.useRecurringAsMonthlyIncome === undefined)
            persistedState.useRecurringAsMonthlyIncome = false;
          if (persistedState.reminderLeadDays === undefined)
            persistedState.reminderLeadDays = 3;
          if (persistedState.autoBackupEnabled === undefined)
            persistedState.autoBackupEnabled = false;
          if (!persistedState.autoBackupFrequency)
            persistedState.autoBackupFrequency = 'daily';
          if (!persistedState.autoBackupMaxCount)
            persistedState.autoBackupMaxCount = 5;
          if (!persistedState.accounts) {
            persistedState.accounts = [{
              id: 'default-account',
              name: 'Default',
              type: 'bank',
              balance: persistedState.initialBalance || 0,
              color: '#6C63FF',
              icon: 'account-balance',
              isDefault: true,
              createdAt: new Date().toISOString(),
            }];
          }
          if (!persistedState.transfers) persistedState.transfers = [];
        }
        // v2 → v3: auth fields + timestamps (all optional, no data changes needed)
        if (version < 3) {
          if (persistedState.userId === undefined) persistedState.userId = null;
          if (persistedState.userEmail === undefined) persistedState.userEmail = null;
        }
        return persistedState;
      },
      version: 3,
    }
  )
);
