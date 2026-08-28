import { Expense, FixedExpense, FREQUENCY_TO_MONTHLY } from '../types';

export interface SpendingInsight {
  id: string;
  type: 'anomaly' | 'trend' | 'milestone' | 'recap';
  title: string;
  message: string;
  icon: string;
  color: string;
}

/**
 * Generate proactive spending insights from local data.
 * No API key required — pure local computation.
 */
export function generateSpendingInsights(
  expenses: Expense[],
  fixedExpenses: FixedExpense[],
  monthlyIncome: number,
  currencySymbol: string,
): SpendingInsight[] {
  const insights: SpendingInsight[] = [];
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const nonFixed = expenses.filter((e) => !e.isFixed);
  const currentExpenses = nonFixed.filter((e) => e.date.substring(0, 7) === currentMonth);
  const prevExpenses = nonFixed.filter((e) => e.date.substring(0, 7) === prevMonth);

  const currentTotal = currentExpenses.reduce((s, e) => s + e.amount, 0);
  const prevTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);

  // Monthly recap comparison
  if (prevTotal > 0) {
    const change = ((currentTotal - prevTotal) / prevTotal) * 100;
    const direction = change >= 0 ? 'more' : 'less';
    const absChange = Math.abs(change).toFixed(0);
    insights.push({
      id: 'recap-monthly',
      type: 'recap',
      title: 'Monthly Comparison',
      message: `You've spent ${currencySymbol}${currentTotal.toFixed(0)} this month — ${absChange}% ${direction} than last month (${currencySymbol}${prevTotal.toFixed(0)}).`,
      icon: change >= 0 ? 'trending-up' : 'trending-down',
      color: change >= 0 ? '#FF3D71' : '#00D68F',
    });
  }

  // Category anomaly detection — compare this month vs last for each category
  const currentByCategory: Record<string, number> = {};
  const prevByCategory: Record<string, number> = {};

  currentExpenses.forEach((e) => {
    currentByCategory[e.category] = (currentByCategory[e.category] || 0) + e.amount;
  });
  prevExpenses.forEach((e) => {
    prevByCategory[e.category] = (prevByCategory[e.category] || 0) + e.amount;
  });

  for (const [category, amount] of Object.entries(currentByCategory)) {
    const prevAmount = prevByCategory[category] || 0;
    if (prevAmount > 0 && amount >= prevAmount * 2) {
      const multiplier = (amount / prevAmount).toFixed(1);
      insights.push({
        id: `anomaly-${category}`,
        type: 'anomaly',
        title: `${category} Spending Spike`,
        message: `You've spent ${multiplier}x more on ${category} this month (${currencySymbol}${amount.toFixed(0)}) compared to last month (${currencySymbol}${prevAmount.toFixed(0)}).`,
        icon: 'warning',
        color: '#FFAA00',
      });
    }
  }

  // Weekly pace check — are we on track to overspend?
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projectedTotal = (currentTotal / dayOfMonth) * daysInMonth;
  const fixedTotal = fixedExpenses.filter((e) => !e.paused).reduce((s, e) => {
    return s + e.amount * FREQUENCY_TO_MONTHLY[e.frequency || 'monthly'];
  }, 0);

  if (monthlyIncome > 0 && projectedTotal + fixedTotal > monthlyIncome && dayOfMonth >= 7) {
    insights.push({
      id: 'trend-overspend',
      type: 'trend',
      title: 'Spending Pace Warning',
      message: `At your current pace, you'll spend ~${currencySymbol}${(projectedTotal + fixedTotal).toFixed(0)} this month, which exceeds your ${currencySymbol}${monthlyIncome.toFixed(0)} income.`,
      icon: 'speed',
      color: '#FF6B9D',
    });
  }

  // New category detection
  const allPrevCategories = new Set(prevExpenses.map((e) => e.category));
  for (const [category, amount] of Object.entries(currentByCategory)) {
    if (!allPrevCategories.has(category) && amount > 50) {
      insights.push({
        id: `new-category-${category}`,
        type: 'milestone',
        title: `New Spending Category`,
        message: `First time spending on ${category} this month: ${currencySymbol}${amount.toFixed(0)}.`,
        icon: 'new-releases',
        color: '#6C63FF',
      });
    }
  }

  // Expense-free streak detection
  if (currentExpenses.length > 0) {
    const sortedDates = currentExpenses
      .map((e) => new Date(e.date).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const lastExpenseDate = new Date(sortedDates[0]);
    const daysSince = Math.floor((now.getTime() - lastExpenseDate.getTime()) / 86400000);
    if (daysSince >= 3) {
      insights.push({
        id: 'streak-no-spend',
        type: 'milestone',
        title: 'No-Spend Streak',
        message: `${daysSince} days without spending — keep it up!`,
        icon: 'emoji-events',
        color: '#00D68F',
      });
    }
  }

  return insights;
}
