/**
 * Safe-to-Spend & Age-of-Money utilities
 */

import { Expense, Income, FixedExpense, FixedIncome, FREQUENCY_TO_MONTHLY } from '../types';

/**
 * Calculate daily "safe to spend" amount for the current month.
 * Formula: (totalIncome - totalSpent - upcomingBills) / remainingDays
 */
export function calculateSafeToSpend(
  monthlyIncome: number,
  fixedIncomeTotal: number,
  extraIncome: number,
  monthlySpent: number,
  fixedExpensesTotal: number,
  useRecurringAsMonthlyIncome: boolean,
): { daily: number; remaining: number; daysLeft: number } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  const daysLeft = Math.max(1, daysInMonth - today + 1); // include today

  const totalIncome = (useRecurringAsMonthlyIncome ? 0 : monthlyIncome) + fixedIncomeTotal + extraIncome;
  const totalSpent = monthlySpent + fixedExpensesTotal;
  const remaining = totalIncome - totalSpent;
  const daily = remaining / daysLeft;

  return { daily, remaining, daysLeft };
}

/**
 * Calculate "Age of Money" — average number of days between receiving money
 * and spending it. Inspired by YNAB's concept.
 *
 * Algorithm: For each expense in the last 30 days, find the income that
 * "funded" it by walking backward through income chronologically (FIFO).
 * The age is the average gap in days between income date and expense date.
 *
 * A higher age means money sits longer before being spent = healthier finances.
 */
export function calculateAgeOfMoney(
  incomes: Income[],
  expenses: Expense[],
  fixedIncomes: FixedIncome[],
  monthlyIncome: number,
): number | null {
  // We need at least some income and expenses to calculate
  if (incomes.length === 0 && monthlyIncome <= 0) return null;
  if (expenses.length === 0) return null;

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Recent expenses (last 30 days, non-fixed)
  const recentExpenses = expenses
    .filter((e) => !e.isFixed && new Date(e.date) >= thirtyDaysAgo)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (recentExpenses.length === 0) return null;

  // All income sorted chronologically (oldest first)
  const allIncome = incomes
    .map((i) => ({ date: new Date(i.date), amount: i.amount }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // If we have monthly income, treat it as income on the 1st of each month
  // going back 12 months
  if (monthlyIncome > 0) {
    for (let m = 0; m < 12; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      allIncome.push({ date: d, amount: monthlyIncome });
    }
    allIncome.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  if (allIncome.length === 0) return null;

  // FIFO matching: walk through income pool, match to expenses
  const incomePool = allIncome.map((i) => ({ ...i, remaining: i.amount }));
  let totalAge = 0;
  let totalMatched = 0;
  let poolIdx = 0;

  for (const expense of recentExpenses) {
    let expenseRemaining = expense.amount;
    const expenseDate = new Date(expense.date);

    while (expenseRemaining > 0 && poolIdx < incomePool.length) {
      const income = incomePool[poolIdx];
      if (income.remaining <= 0) {
        poolIdx++;
        continue;
      }

      const matched = Math.min(expenseRemaining, income.remaining);
      const ageDays = Math.max(0, (expenseDate.getTime() - income.date.getTime()) / (1000 * 60 * 60 * 24));

      totalAge += ageDays * matched;
      totalMatched += matched;

      income.remaining -= matched;
      expenseRemaining -= matched;

      if (income.remaining <= 0) poolIdx++;
    }
  }

  if (totalMatched === 0) return null;
  return Math.round(totalAge / totalMatched);
}
