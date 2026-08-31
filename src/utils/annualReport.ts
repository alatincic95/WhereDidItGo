import { Platform, Share } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Expense, Income, FixedExpense, FixedIncome, FREQUENCY_TO_MONTHLY } from '../types';

export interface AnnualCategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface AnnualMonthBreakdown {
  month: string; // YYYY-MM
  label: string; // "Jan", "Feb", etc.
  income: number;
  expenses: number;
  net: number;
}

export interface AnnualReportData {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  categoryBreakdown: AnnualCategoryBreakdown[];
  monthlyBreakdown: AnnualMonthBreakdown[];
  incomeSourceBreakdown: { source: string; amount: number; percentage: number }[];
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getAnnualReportData(
  year: number,
  expenses: Expense[],
  incomes: Income[],
  fixedExpenses: FixedExpense[],
  fixedIncomes: FixedIncome[],
  convertToBase: (amount: number, currency?: string) => number,
): AnnualReportData {
  // Filter to year
  const yearExpenses = expenses.filter((e) => !e.isFixed && e.date.startsWith(`${year}`));
  const yearIncomes = incomes.filter((i) => i.date.startsWith(`${year}`));

  // Total expenses with currency conversion
  const totalExpenses = yearExpenses.reduce((sum, e) => sum + convertToBase(e.amount, e.currency), 0);

  // Add recurring expenses prorated for months in the year
  const now = new Date();
  const monthsInYear = year === now.getFullYear() ? now.getMonth() + 1 : 12;
  const recurringExpenseTotal = fixedExpenses
    .filter((e) => !e.paused)
    .reduce((sum, e) => {
      const multiplier = FREQUENCY_TO_MONTHLY[e.frequency || 'monthly'];
      return sum + e.amount * multiplier * monthsInYear;
    }, 0);

  const recurringIncomeTotal = fixedIncomes
    .filter((i) => !i.paused)
    .reduce((sum, i) => {
      const multiplier = FREQUENCY_TO_MONTHLY[i.frequency || 'monthly'];
      return sum + i.amount * multiplier * monthsInYear;
    }, 0);

  const totalIncome = yearIncomes.reduce((sum, i) => sum + i.amount, 0) + recurringIncomeTotal;
  const totalExpensesWithRecurring = totalExpenses + recurringExpenseTotal;

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  yearExpenses.forEach((e) => {
    if (e.splits && e.splits.length > 0) {
      e.splits.forEach((s) => {
        categoryMap[s.category] = (categoryMap[s.category] || 0) + convertToBase(s.amount, e.currency);
      });
    } else {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + convertToBase(e.amount, e.currency);
    }
  });
  // Add recurring to categories
  fixedExpenses.filter((e) => !e.paused).forEach((e) => {
    const multiplier = FREQUENCY_TO_MONTHLY[e.frequency || 'monthly'];
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount * multiplier * monthsInYear;
  });

  const categoryBreakdown = Object.entries(categoryMap)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpensesWithRecurring > 0 ? (amount / totalExpensesWithRecurring) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Income source breakdown
  const sourceMap: Record<string, number> = {};
  yearIncomes.forEach((i) => {
    sourceMap[i.source] = (sourceMap[i.source] || 0) + i.amount;
  });
  fixedIncomes.filter((i) => !i.paused).forEach((i) => {
    const multiplier = FREQUENCY_TO_MONTHLY[i.frequency || 'monthly'];
    sourceMap[i.source] = (sourceMap[i.source] || 0) + i.amount * multiplier * monthsInYear;
  });

  const incomeSourceBreakdown = Object.entries(sourceMap)
    .map(([source, amount]) => ({
      source,
      amount,
      percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Monthly breakdown
  const monthlyBreakdown: AnnualMonthBreakdown[] = [];
  for (let m = 0; m < 12; m++) {
    const monthStr = `${year}-${String(m + 1).padStart(2, '0')}`;
    const monthExpenses = yearExpenses
      .filter((e) => e.date.substring(0, 7) === monthStr)
      .reduce((sum, e) => sum + convertToBase(e.amount, e.currency), 0);
    const monthIncome = yearIncomes
      .filter((i) => i.date.substring(0, 7) === monthStr)
      .reduce((sum, i) => sum + i.amount, 0);

    // Add recurring monthly amounts
    const recExpMonth = fixedExpenses.filter((e) => !e.paused).reduce((sum, e) => {
      return sum + e.amount * FREQUENCY_TO_MONTHLY[e.frequency || 'monthly'];
    }, 0);
    const recIncMonth = fixedIncomes.filter((i) => !i.paused).reduce((sum, i) => {
      return sum + i.amount * FREQUENCY_TO_MONTHLY[i.frequency || 'monthly'];
    }, 0);

    const totalMonthExp = monthExpenses + recExpMonth;
    const totalMonthInc = monthIncome + recIncMonth;

    monthlyBreakdown.push({
      month: monthStr,
      label: MONTH_LABELS[m],
      income: totalMonthInc,
      expenses: totalMonthExp,
      net: totalMonthInc - totalMonthExp,
    });
  }

  return {
    year,
    totalIncome,
    totalExpenses: totalExpensesWithRecurring,
    netBalance: totalIncome - totalExpensesWithRecurring,
    categoryBreakdown,
    monthlyBreakdown,
    incomeSourceBreakdown,
  };
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportAnnualReportCsv(
  data: AnnualReportData,
  currencySymbol: string,
): Promise<void> {
  const lines: string[] = [];

  lines.push(`Annual Financial Report - ${data.year}`);
  lines.push('');
  lines.push('SUMMARY');
  lines.push(`Total Income,${currencySymbol}${data.totalIncome.toFixed(2)}`);
  lines.push(`Total Expenses,${currencySymbol}${data.totalExpenses.toFixed(2)}`);
  lines.push(`Net Balance,${currencySymbol}${data.netBalance.toFixed(2)}`);
  lines.push('');

  lines.push('EXPENSES BY CATEGORY');
  lines.push('Category,Amount,Percentage');
  data.categoryBreakdown.forEach((c) => {
    lines.push(`${escapeCsv(c.category)},${currencySymbol}${c.amount.toFixed(2)},${c.percentage.toFixed(1)}%`);
  });
  lines.push('');

  lines.push('INCOME BY SOURCE');
  lines.push('Source,Amount,Percentage');
  data.incomeSourceBreakdown.forEach((s) => {
    lines.push(`${escapeCsv(s.source)},${currencySymbol}${s.amount.toFixed(2)},${s.percentage.toFixed(1)}%`);
  });
  lines.push('');

  lines.push('MONTHLY BREAKDOWN');
  lines.push('Month,Income,Expenses,Net');
  data.monthlyBreakdown.forEach((m) => {
    lines.push(`${m.label},${currencySymbol}${m.income.toFixed(2)},${currencySymbol}${m.expenses.toFixed(2)},${currencySymbol}${m.net.toFixed(2)}`);
  });

  const csvContent = lines.join('\n');
  const fileName = `annual-report-${data.year}.csv`;

  if (Platform.OS === 'web') {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, fileName);
  await file.create();
  await file.write(csvContent);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: `Annual Report ${data.year}` });
  } else {
    await Share.share({ message: csvContent });
  }
}
