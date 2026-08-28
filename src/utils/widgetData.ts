import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const WIDGET_DATA_KEY = '@widget_data';

export interface WidgetData {
  monthlyBalance: number;
  overallBalance: number;
  monthlyExpenses: number;
  monthlyIncome: number;
  fixedExpensesTotal: number;
  fixedIncomeTotal: number;
  currencySymbol: string;
  topCategories: { name: string; amount: number }[];
  updatedAt: string;
}

/**
 * Writes widget data to AsyncStorage (and shared UserDefaults/SharedPreferences
 * when native modules are available after expo prebuild).
 * Call this on app launch and after any data mutation.
 */
export async function syncWidgetData(data: WidgetData): Promise<void> {
  try {
    const json = JSON.stringify(data);
    await AsyncStorage.setItem(WIDGET_DATA_KEY, json);

    // When running with native code (after expo prebuild), use shared app group
    // storage so the widget extension can read it:
    // iOS: NSUserDefaults(suiteName: "group.com.wheredididitgo.app")
    // Android: SharedPreferences via react-native-shared-group-preferences
    // This is a no-op in Expo Go / managed workflow.
    if (Platform.OS === 'ios') {
      try {
        const SharedGroupPreferences = require('react-native-shared-group-preferences');
        await SharedGroupPreferences.default.setItem(
          'widgetData',
          JSON.parse(json),
          'group.com.wheredididitgo.app'
        );
      } catch {
        // Not available in managed workflow — expected
      }
    }
  } catch {
    // Silently fail — widget data is non-critical
  }
}

/**
 * Build WidgetData from current store state.
 * Import and call from App.tsx on mount and after mutations.
 */
export function buildWidgetData(store: {
  getMonthlyTotal: (month: string) => number;
  getMonthlyExtraIncome: (month: string) => number;
  getFixedExpensesTotal: () => number;
  getFixedIncomesTotal: () => number;
  getCategoryTotals: (month: string) => Record<string, number>;
  monthlyIncome: number;
  currencySymbol: string;
}): WidgetData {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthlyExpenses = store.getMonthlyTotal(month);
  const fixedExpensesTotal = store.getFixedExpensesTotal();
  const fixedIncomeTotal = store.getFixedIncomesTotal();
  const monthlyExtraIncome = store.getMonthlyExtraIncome(month);

  const monthlyBalance = store.monthlyIncome + monthlyExtraIncome + fixedIncomeTotal - monthlyExpenses - fixedExpensesTotal;

  const categoryTotals = store.getCategoryTotals(month);
  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }));

  return {
    monthlyBalance,
    overallBalance: 0, // Computed by caller if needed
    monthlyExpenses,
    monthlyIncome: store.monthlyIncome + monthlyExtraIncome + fixedIncomeTotal,
    fixedExpensesTotal,
    fixedIncomeTotal,
    currencySymbol: store.currencySymbol,
    topCategories,
    updatedAt: new Date().toISOString(),
  };
}
