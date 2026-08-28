/**
 * i18n preparation layer.
 *
 * Currently ships English-only. Strings are extracted here to make future
 * localization straightforward — just add new locale files and a language
 * switcher in Settings.
 *
 * Usage:
 *   import { t } from '../i18n';
 *   <Text>{t('dashboard.greeting')}</Text>
 */

type TranslationKeys = typeof en;
type FlatKeys<T, Prefix extends string = ''> = T extends object
  ? { [K in keyof T]: FlatKeys<T[K], `${Prefix}${Prefix extends '' ? '' : '.'}${K & string}`> }[keyof T]
  : Prefix;

const en = {
  common: {
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    close: 'Close',
    reset: 'Reset',
    search: 'Search',
    noResults: 'No results found',
    tryAgain: 'Try Again',
    undo: 'UNDO',
    confirm: 'Confirm',
    back: 'Back',
    done: 'Done',
    all: 'All',
    today: 'Today',
    yesterday: 'Yesterday',
  },
  dashboard: {
    greeting: {
      morning: 'Good Morning',
      afternoon: 'Good Afternoon',
      evening: 'Good Evening',
    },
    title: 'Your Finances',
    monthly: 'Monthly',
    overall: 'Overall',
    insights: 'Insights',
    quickAdd: {
      placeholder: 'Quick add: "coffee 4.50"',
    },
  },
  expenses: {
    title: 'Expenses',
    add: 'Add Expense',
    edit: 'Edit Expense',
    searchPlaceholder: 'Search expenses...',
    noExpenses: 'No expenses yet',
    noMatches: 'No matches',
    thisMonth: 'This month',
    allTime: 'All time',
    filtered: 'Filtered',
  },
  income: {
    title: 'Income',
    add: 'Add Income',
    edit: 'Edit Income',
    searchPlaceholder: 'Search income...',
    noIncome: 'No income yet',
  },
  budgets: {
    title: 'Budgets',
    add: 'New Budget',
    edit: 'Edit Budget',
    detail: 'Budget Detail',
    committed: 'Committed',
    pending: 'Pending',
    active: 'Active',
    completed: 'Completed',
  },
  recurring: {
    title: 'Recurring',
    expenses: 'Expenses',
    income: 'Income',
    monthlyExpenses: 'Monthly Expenses',
    monthlyIncome: 'Monthly Income',
    yearly: 'Yearly',
    active: 'Active',
    sources: 'Sources',
    paused: 'Paused',
    pause: 'Pause',
    resume: 'Resume',
    noExpenses: 'No recurring expenses',
    noIncome: 'No recurring income',
  },
  savings: {
    title: 'Savings Goals',
    add: 'New Goal',
    addFunds: 'Add Funds',
  },
  settings: {
    title: 'Settings',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    biometric: 'Biometric Lock',
    pushNotifications: 'Push Notifications',
    categoryBudgets: 'Category Budgets',
    customizeDashboard: 'Customize Dashboard',
    reorderCategories: 'Reorder Categories',
    backupTransfer: 'Backup & Transfer',
    aiAssistant: 'AI Assistant',
    apiKey: 'API Key',
  },
  notifications: {
    title: 'Notifications',
    markAllRead: 'Mark all as read',
    clearAll: 'Clear all',
    billReminder: 'Bill Reminder',
    monthlyRecap: 'Monthly Spending Recap',
  },
  filters: {
    title: 'Filters',
    sortBy: 'Sort By',
    categories: 'Categories',
    amountRange: 'Amount Range',
    dateRange: 'Date Range',
    showResults: 'Show Results',
  },
  search: {
    title: 'Search everything',
    subtitle: 'Find expenses, income, budgets, recurring items, and savings goals',
    placeholder: 'Search expenses, income, budgets, goals...',
  },
  calendar: {
    title: 'Bill Calendar',
    billsDue: 'Bills Due',
    incomeDue: 'Income Due',
    upcomingBills: 'Upcoming Bills',
    noBills: 'No bills this month',
  },
  errors: {
    somethingWentWrong: 'Something went wrong',
    unexpectedError: 'An unexpected error occurred.',
  },
};

// Current locale strings
let strings: typeof en = en;

/**
 * Get a translated string by dot-separated key path.
 * Returns the key itself if not found.
 */
export function t(key: string): string {
  const parts = key.split('.');
  let current: any = strings;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return key; // fallback to key
    }
  }
  return typeof current === 'string' ? current : key;
}

/**
 * Get the full strings object for the current locale.
 * Useful for screens that need multiple strings at once.
 */
export function getStrings() {
  return strings;
}

/**
 * Set the active locale strings.
 * Future: load from a JSON file or remote source.
 */
export function setLocale(locale: typeof en) {
  strings = locale;
}

export { en };
