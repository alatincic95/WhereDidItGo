import { StateCreator } from 'zustand';
import { ExchangeRate, CustomCategory, CategoryBudget, DashboardCardConfig, DEFAULT_DASHBOARD_CARDS, EXPENSE_CATEGORIES, FREQUENCY_TO_MONTHLY } from '../../types';
import { ThemeMode } from '../../constants/theme';
import { StoreState } from '../useExpenseStore';

export interface SettingsSlice {
  initialBalance: number;
  monthlyIncome: number;
  currencySymbol: string;
  themeMode: ThemeMode;
  biometricEnabled: boolean;
  pushNotificationsEnabled: boolean;
  onboardingCompleted: boolean;
  autoBackupReminder: boolean;
  lastBackupDate: string | null;
  exchangeRates: ExchangeRate[];
  customCategories: CustomCategory[];
  categoryOrder: string[];
  categoryBudgets: CategoryBudget[];
  dashboardCards: DashboardCardConfig[];

  // Exchange Rate Actions
  addExchangeRate: (rate: ExchangeRate) => void;
  updateExchangeRate: (from: string, rate: number) => void;
  deleteExchangeRate: (from: string) => void;
  convertToBase: (amount: number, currency?: string) => number;

  // Custom Categories
  addCustomCategory: (category: CustomCategory) => void;
  deleteCustomCategory: (name: string) => void;

  // Category Order
  setCategoryOrder: (order: string[]) => void;
  getOrderedCategories: () => string[];

  // Category Budgets
  setCategoryBudget: (category: string, monthlyLimit: number) => void;
  removeCategoryBudget: (category: string) => void;
  toggleCategoryBudget: (category: string) => void;
  toggleCategoryBudgetRollover: (category: string) => void;
  processRollovers: () => void;
  getCategoryBudgetStatus: (month: string) => Array<{
    category: string;
    limit: number;
    spent: number;
    percentage: number;
    enabled: boolean;
    rolloverAmount: number;
    effectiveLimit: number;
  }>;

  // Dashboard Customization
  setDashboardCards: (cards: DashboardCardConfig[]) => void;
  resetDashboardCards: () => void;

  // Settings Setters
  setInitialBalance: (amount: number) => void;
  setMonthlyIncome: (amount: number) => void;
  setCurrencySymbol: (symbol: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setPushNotificationsEnabled: (enabled: boolean) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setAutoBackupReminder: (enabled: boolean) => void;
  setLastBackupDate: (date: string) => void;
  resetAllData: () => Promise<void>;
}

export const createSettingsSlice: StateCreator<StoreState, [], [], SettingsSlice> = (set, get) => ({
  initialBalance: 5000,
  monthlyIncome: 3000,
  currencySymbol: '$',
  themeMode: 'dark' as ThemeMode,
  biometricEnabled: false,
  pushNotificationsEnabled: false,
  onboardingCompleted: false,
  autoBackupReminder: false,
  lastBackupDate: null,
  exchangeRates: [],
  customCategories: [],
  categoryOrder: [],
  categoryBudgets: [],
  dashboardCards: DEFAULT_DASHBOARD_CARDS,

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

  toggleCategoryBudgetRollover: (category) =>
    set((state) => ({
      categoryBudgets: state.categoryBudgets.map((b) =>
        b.category === category ? { ...b, rolloverEnabled: !b.rolloverEnabled } : b
      ),
    })),

  processRollovers: () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    // Previous month
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;

    set((state) => ({
      categoryBudgets: state.categoryBudgets.map((cb) => {
        if (!cb.rolloverEnabled) return cb;
        if (cb.lastRolloverMonth === currentMonth) return cb; // already processed
        // Calculate what was spent last month
        const prevExpenses = state.expenses
          .filter((e) => e.date.substring(0, 7) === prevMonth && !e.isFixed);
        const convert = get().convertToBase;
        let spent = 0;
        prevExpenses.forEach((e) => {
          if (e.splits && e.splits.length > 0) {
            e.splits.forEach((s) => {
              if (s.category === cb.category) spent += convert(s.amount, e.currency);
            });
          } else if (e.category === cb.category) {
            spent += convert(e.amount, e.currency);
          }
        });
        state.fixedExpenses.filter((e) => !e.paused).forEach((e) => {
          if (e.category === cb.category) {
            const multiplier = FREQUENCY_TO_MONTHLY[e.frequency || 'monthly'];
            spent += e.amount * multiplier;
          }
        });
        const prevEffective = cb.monthlyLimit + (cb.rolloverAmount || 0);
        const unused = Math.max(0, prevEffective - spent);
        return {
          ...cb,
          rolloverAmount: unused,
          lastRolloverMonth: currentMonth,
        };
      }),
    }));
  },

  getCategoryBudgetStatus: (month) => {
    const { categoryBudgets, fixedExpenses } = get();
    const monthlyExpenses = get().getMonthlyExpenses(month).filter((e) => !e.isFixed);
    const convert = get().convertToBase;

    return categoryBudgets.map((cb) => {
      let spent = 0;
      monthlyExpenses.forEach((e) => {
        if (e.splits && e.splits.length > 0) {
          e.splits.forEach((s) => {
            if (s.category === cb.category) spent += convert(s.amount, e.currency);
          });
        } else if (e.category === cb.category) {
          spent += convert(e.amount, e.currency);
        }
      });
      fixedExpenses.filter((e) => !e.paused).forEach((e) => {
        if (e.category === cb.category) {
          const multiplier = FREQUENCY_TO_MONTHLY[e.frequency || 'monthly'];
          spent += e.amount * multiplier;
        }
      });
      const rolloverAmount = cb.rolloverEnabled ? (cb.rolloverAmount || 0) : 0;
      const effectiveLimit = cb.monthlyLimit + rolloverAmount;
      return {
        category: cb.category,
        limit: cb.monthlyLimit,
        spent,
        percentage: effectiveLimit > 0 ? spent / effectiveLimit : 0,
        enabled: cb.enabled,
        rolloverAmount,
        effectiveLimit,
      };
    });
  },

  // Dashboard Customization
  setDashboardCards: (cards) => set({ dashboardCards: cards }),
  resetDashboardCards: () => set({ dashboardCards: DEFAULT_DASHBOARD_CARDS }),

  // Settings Setters
  setInitialBalance: (amount) => set({ initialBalance: amount }),
  setMonthlyIncome: (amount) => set({ monthlyIncome: amount }),
  setCurrencySymbol: (symbol) => set({ currencySymbol: symbol }),
  setThemeMode: (mode) => set({ themeMode: mode }),
  setBiometricEnabled: (enabled) => set({ biometricEnabled: enabled }),
  setPushNotificationsEnabled: (enabled) => set({ pushNotificationsEnabled: enabled }),
  setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
  setAutoBackupReminder: (enabled) => set({ autoBackupReminder: enabled }),
  setLastBackupDate: (date) => set({ lastBackupDate: date }),
  resetAllData: async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.clear();
    set({
      expenses: [],
      fixedExpenses: [],
      incomes: [],
      fixedIncomes: [],
      budgets: [],
      customCategories: [],
      categoryOrder: [],
      exchangeRates: [],
      savingsGoals: [],
      budgetTemplates: [],
      categoryBudgets: [],
      dashboardCards: DEFAULT_DASHBOARD_CARDS,
      initialBalance: 0,
      monthlyIncome: 0,
      currencySymbol: '$',
      themeMode: 'dark' as ThemeMode,
      biometricEnabled: false,
      pushNotificationsEnabled: false,
      onboardingCompleted: false,
      autoBackupReminder: false,
      lastBackupDate: null,
    });
  },
});
