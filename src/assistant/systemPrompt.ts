import { useExpenseStore } from '../store/useExpenseStore';
import { formatCurrency } from '../utils/currency';
import { getCurrentMonth } from '../components/dashboard/helpers';
import { EXPENSE_CATEGORIES, INCOME_SOURCES, FREQUENCY_OPTIONS } from '../types';

export function buildSystemPrompt(): string {
  const store = useExpenseStore.getState();
  const currentMonth = getCurrentMonth();

  // Compute financial snapshot
  const monthlyBalance = store.getMonthlyBalance(currentMonth);
  const overallBalance = store.getOverallBalance();
  const monthlyTotal = store.getMonthlyTotal(currentMonth);
  const fixedExpensesTotal = store.getFixedExpensesTotal();
  const fixedIncomeTotal = store.getFixedIncomesTotal();
  const categoryTotals = store.getCategoryTotals(currentMonth);

  // Format category breakdown
  const categoryBreakdown = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cat, total]) => `${cat}: ${formatCurrency(total)}`)
    .join(', ');

  // Active budgets
  const activeBudgets = store.budgets
    .filter((b) => b.status === 'active')
    .map((b) => {
      const spent = store.getBudgetTotal(b.id);
      const limit = b.budget ? `/${formatCurrency(b.budget)}` : '';
      return `"${b.name}" (${formatCurrency(spent)}${limit})`;
    })
    .join(', ');

  // Savings goals
  const goals = store.savingsGoals
    .map((g) => `"${g.name}" (${formatCurrency(g.currentAmount)}/${formatCurrency(g.targetAmount)})`)
    .join(', ');

  // Recurring expenses
  const recurring = store.fixedExpenses
    .map((e) => {
      const freq = e.frequency || 'monthly';
      const freqLabel = FREQUENCY_OPTIONS.find((f) => f.value === freq)?.shortLabel || freq;
      return `${e.description} ${formatCurrency(e.amount)}/${freqLabel}`;
    })
    .join(', ');

  // Recurring income
  const recurringIncome = store.fixedIncomes
    .map((i) => {
      const freq = i.frequency || 'monthly';
      const freqLabel = FREQUENCY_OPTIONS.find((f) => f.value === freq)?.shortLabel || freq;
      return `${i.description} ${formatCurrency(i.amount)}/${freqLabel}`;
    })
    .join(', ');

  // Custom categories
  const customCats = store.customCategories.map((c) => c.name);
  const allCategories = [...EXPENSE_CATEGORIES, ...customCats].join(', ');

  const today = new Date().toISOString().split('T')[0];
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return `You are a friendly and concise financial assistant for the WhereDidItGo expense tracking app. You help users manage their expenses, income, budgets, and savings goals through conversation.

CURRENT FINANCIAL SNAPSHOT (${monthName}):
- Currency: ${store.currencySymbol}
- Base monthly income: ${formatCurrency(store.monthlyIncome)}
- Recurring income total: ${formatCurrency(fixedIncomeTotal)}/month
- Monthly balance: ${formatCurrency(monthlyBalance)}
- Overall balance: ${formatCurrency(overallBalance)}
- Expenses this month: ${formatCurrency(monthlyTotal)}
- Recurring expenses total: ${formatCurrency(fixedExpensesTotal)}/month
${categoryBreakdown ? `- Top categories this month: ${categoryBreakdown}` : '- No expenses this month yet'}
${activeBudgets ? `- Active budgets: ${activeBudgets}` : '- No active budgets'}
${goals ? `- Savings goals: ${goals}` : '- No savings goals'}
${recurring ? `- Recurring expenses: ${recurring}` : '- No recurring expenses'}
${recurringIncome ? `- Recurring income: ${recurringIncome}` : '- No recurring income'}

AVAILABLE CATEGORIES: ${allCategories}
INCOME SOURCES: ${INCOME_SOURCES.join(', ')}
FREQUENCIES: weekly, biweekly, monthly, quarterly, yearly

TODAY'S DATE: ${today}

RULES:
- Keep responses concise (1-3 sentences unless the user asks for detail)
- Always use ${store.currencySymbol} when mentioning amounts
- When adding an expense, pick the most logical category based on the description
- When the user says "delete last expense", use the delete_last_expense tool
- If unsure about a category, default to "Other"
- If the user asks about something the app can't do, briefly explain what IS possible
- Be conversational and friendly, like a helpful financial buddy
- Use the tools to take actions and get data — don't make up numbers
- CRITICAL: NEVER include raw JSON, code, or tool output in your responses. Always respond in plain, natural language only. Summarize tool results in human-readable sentences.`;
}
