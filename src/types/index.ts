export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO date string
  isFixed: boolean;
  projectId?: string; // optional link to a budget
  isPending?: boolean; // if true, not deducted from budget until marked complete
  currency?: string; // ISO currency code, e.g. 'EUR'. If absent, uses base currency
  receiptUri?: string; // local URI to receipt photo
  tags?: string[]; // cross-cutting labels (e.g., "Vacation", "Tax-deductible")
  splits?: ExpenseSplit[]; // optional split across categories/budgets; sum equals amount
}

export interface ExpenseSplit {
  category: string;
  amount: number; // in expense's currency
  projectId?: string;
}

export interface ExchangeRate {
  from: string; // e.g. 'EUR'
  rate: number; // how many base currency units per 1 unit of 'from'
}

export type BudgetStatus = 'active' | 'completed';

export interface Budget {
  id: string;
  name: string;
  description: string;
  budget?: number; // optional spending limit
  color: string;
  status: BudgetStatus;
  createdAt: string; // ISO date string
}

// Notifications
export type NotificationType =
  | 'budget_warning'
  | 'budget_exceeded'
  | 'project_budget_warning'
  | 'project_budget_exceeded'
  | 'category_budget_warning'
  | 'category_budget_exceeded'
  | 'bill_reminder'
  | 'milestone'
  | 'tip';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  color: string;
  read: boolean;
  createdAt: string;
  relatedId?: string; // projectId, expenseId, etc.
}

export const NOTIFICATION_TYPE_META: Record<NotificationType, { icon: string; color: string }> = {
  budget_warning: { icon: 'warning', color: '#FFAA00' },
  budget_exceeded: { icon: 'error', color: '#FF3D71' },
  project_budget_warning: { icon: 'folder-special', color: '#FFAA00' },
  project_budget_exceeded: { icon: 'folder-off', color: '#FF3D71' },
  category_budget_warning: { icon: 'pie-chart', color: '#FFAA00' },
  category_budget_exceeded: { icon: 'pie-chart', color: '#FF3D71' },
  bill_reminder: { icon: 'notifications-active', color: '#45B7D1' },
  milestone: { icon: 'emoji-events', color: '#00D68F' },
  tip: { icon: 'lightbulb', color: '#BB8FCE' },
};

export const BUDGET_COLORS = [
  '#6C63FF',
  '#FF6B9D',
  '#00D68F',
  '#FF8E53',
  '#45B7D1',
  '#BB8FCE',
  '#F7DC6F',
  '#EC7063',
  '#5DADE2',
  '#82E0AA',
  '#F0B27A',
  '#4ECDC4',
];

export interface Income {
  id: string;
  amount: number;
  source: IncomeSource;
  description: string;
  date: string; // ISO date string
}

export type IncomeSource =
  | 'Gift'
  | 'Bonus'
  | 'Freelance'
  | 'Sale'
  | 'Refund'
  | 'Investment'
  | 'Other';

export const INCOME_SOURCES: IncomeSource[] = [
  'Gift',
  'Bonus',
  'Freelance',
  'Sale',
  'Refund',
  'Investment',
  'Other',
];

export const INCOME_SOURCE_ICONS: Record<IncomeSource, string> = {
  Gift: 'card-giftcard',
  Bonus: 'star',
  Freelance: 'laptop',
  Sale: 'sell',
  Refund: 'replay',
  Investment: 'trending-up',
  Other: 'more-horiz',
};

export const INCOME_SOURCE_COLORS: Record<IncomeSource, string> = {
  Gift: '#FF6B9D',
  Bonus: '#FFD700',
  Freelance: '#6C63FF',
  Sale: '#4ECDC4',
  Refund: '#45B7D1',
  Investment: '#00D68F',
  Other: '#AEB6BF',
};

export interface CustomCategory {
  name: string;
  icon: string;
  color: string;
}

export interface CategoryBudget {
  category: string;       // matches ExpenseCategory or CustomCategory.name
  monthlyLimit: number;   // spending cap in base currency
  enabled: boolean;       // toggle without deleting
  rolloverEnabled?: boolean;  // if true, unused budget carries to next month
  rolloverAmount?: number;    // accumulated rollover from previous months
  lastRolloverMonth?: string; // YYYY-MM of last rollover computation
}

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string; shortLabel: string }[] = [
  { value: 'weekly', label: 'Weekly', shortLabel: 'Week' },
  { value: 'biweekly', label: 'Bi-weekly', shortLabel: '2 Wks' },
  { value: 'monthly', label: 'Monthly', shortLabel: 'Month' },
  { value: 'quarterly', label: 'Quarterly', shortLabel: 'Qtr' },
  { value: 'yearly', label: 'Yearly', shortLabel: 'Year' },
];

export const FREQUENCY_TO_MONTHLY: Record<RecurringFrequency, number> = {
  weekly: 52 / 12,       // ~4.333
  biweekly: 26 / 12,     // ~2.167
  monthly: 1,
  quarterly: 1 / 3,      // ~0.333
  yearly: 1 / 12,        // ~0.083
};

export interface FixedExpense {
  id: string;
  amount: number;
  category: string;
  description: string;
  frequency?: RecurringFrequency; // defaults to 'monthly' if absent (backward compat)
  startDate?: string; // YYYY-MM-DD when this recurring item was created
  lastProcessedDate?: string; // YYYY-MM-DD of last auto-generated expense
  paused?: boolean; // if true, skip auto-processing and balance calculations
}

export interface FixedIncome {
  id: string;
  amount: number;
  source: string;
  description: string;
  frequency?: RecurringFrequency; // defaults to 'monthly' if absent (backward compat)
  startDate?: string; // YYYY-MM-DD when this recurring item was created
  lastProcessedDate?: string; // YYYY-MM-DD of last auto-generated income
  paused?: boolean; // if true, skip auto-processing and balance calculations
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // ISO date string
  color: string;
  icon: string;
  createdAt: string;
  autoContributionMonthly?: number; // optional auto-allocation per month (base currency)
  lastAutoContribution?: string; // YYYY-MM of the last processed auto-contribution
}

export interface ExpenseTemplate {
  id: string;
  name: string;
  amount: number;
  category: string;
  description: string;
  currency?: string;
  tags?: string[];
  icon: string;
  createdAt: string;
}

export interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  budget?: number;
  color: string;
  icon: string;
  createdAt: string;
}

export type DashboardCardId = 'summary' | 'budgetUsage' | 'categories' | 'quickActions' | 'recentTransactions';

export interface DashboardCardConfig {
  id: DashboardCardId;
  visible: boolean;
}

export const DEFAULT_DASHBOARD_CARDS: DashboardCardConfig[] = [
  { id: 'summary', visible: true },
  { id: 'budgetUsage', visible: true },
  { id: 'categories', visible: true },
  { id: 'quickActions', visible: true },
  { id: 'recentTransactions', visible: true },
];

export const DASHBOARD_CARD_LABELS: Record<DashboardCardId, string> = {
  summary: 'Summary Cards',
  budgetUsage: 'Budget Usage',
  categories: 'Top Categories',
  quickActions: 'Quick Actions',
  recentTransactions: 'Recent Transactions',
};

export const DASHBOARD_CARD_ICONS: Record<DashboardCardId, string> = {
  summary: 'account-balance',
  budgetUsage: 'donut-small',
  categories: 'category',
  quickActions: 'flash-on',
  recentTransactions: 'receipt-long',
};

export interface MonthlySummary {
  month: string; // YYYY-MM
  totalExpenses: number;
  totalFixedExpenses: number;
  netBalance: number;
}

export type TrendTimeRange = '6m' | '12m' | 'yoy';

export interface YoYMonthData {
  monthIndex: number;   // 0-11
  monthLabel: string;   // "Jan", "Feb", ...
  years: { year: number; expenses: number; income: number }[];
}

export type ExpenseCategory =
  | 'Food'
  | 'Transport'
  | 'Housing'
  | 'Entertainment'
  | 'Shopping'
  | 'Health'
  | 'Education'
  | 'Bills'
  | 'Subscriptions'
  | 'Other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Transport',
  'Housing',
  'Entertainment',
  'Shopping',
  'Health',
  'Education',
  'Bills',
  'Subscriptions',
  'Other',
];

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  Food: 'restaurant',
  Transport: 'directions-car',
  Housing: 'home',
  Entertainment: 'movie',
  Shopping: 'shopping-bag',
  Health: 'favorite',
  Education: 'school',
  Bills: 'receipt',
  Subscriptions: 'autorenew',
  Other: 'more-horiz',
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Food: '#FF6B6B',
  Transport: '#4ECDC4',
  Housing: '#45B7D1',
  Entertainment: '#F7DC6F',
  Shopping: '#BB8FCE',
  Health: '#EC7063',
  Education: '#5DADE2',
  Bills: '#F0B27A',
  Subscriptions: '#82E0AA',
  Other: '#AEB6BF',
};
