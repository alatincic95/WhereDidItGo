/**
 * Cash Flow Forecasting — project balance forward based on recurring items.
 */

import { FixedExpense, FixedIncome, FREQUENCY_TO_MONTHLY } from '../types';

export interface ForecastMonth {
  month: string; // YYYY-MM
  label: string; // "Jan 2026"
  projectedIncome: number;
  projectedExpenses: number;
  netCashFlow: number;
  projectedBalance: number;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Generate a cash flow forecast for the next N months.
 */
export function generateCashFlowForecast(
  currentBalance: number,
  monthlyIncome: number,
  fixedExpenses: FixedExpense[],
  fixedIncomes: FixedIncome[],
  useRecurringAsMonthlyIncome: boolean,
  months: number = 12,
): ForecastMonth[] {
  const now = new Date();
  const forecast: ForecastMonth[] = [];
  let runningBalance = currentBalance;

  // Calculate monthly recurring totals
  const monthlyRecurringExpenses = fixedExpenses
    .filter((e) => !e.paused)
    .reduce((sum, e) => sum + e.amount * FREQUENCY_TO_MONTHLY[e.frequency || 'monthly'], 0);

  const monthlyRecurringIncome = fixedIncomes
    .filter((i) => !i.paused)
    .reduce((sum, i) => sum + i.amount * FREQUENCY_TO_MONTHLY[i.frequency || 'monthly'], 0);

  const baseIncome = useRecurringAsMonthlyIncome ? 0 : monthlyIncome;
  const totalMonthlyIncome = baseIncome + monthlyRecurringIncome;
  const totalMonthlyExpenses = monthlyRecurringExpenses;

  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;

    const netCashFlow = totalMonthlyIncome - totalMonthlyExpenses;
    runningBalance += netCashFlow;

    forecast.push({
      month: monthStr,
      label,
      projectedIncome: totalMonthlyIncome,
      projectedExpenses: totalMonthlyExpenses,
      netCashFlow,
      projectedBalance: runningBalance,
    });
  }

  return forecast;
}
