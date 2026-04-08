import { Platform, Share } from 'react-native';
import { Expense, FixedExpense, FixedIncome, Income } from '../types';

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildExpensesCsv(expenses: Expense[]): string {
  const header = 'Date,Amount,Currency,Category,Description,Budget Linked,Pending';
  const rows = expenses.map((e) => {
    const date = new Date(e.date).toLocaleDateString('en-US');
    return [
      date,
      e.amount.toFixed(2),
      e.currency || 'Base',
      escapeCsv(e.category),
      escapeCsv(e.description || ''),
      e.projectId ? 'Yes' : 'No',
      e.isPending ? 'Yes' : 'No',
    ].join(',');
  });
  return [header, ...rows].join('\n');
}

function buildIncomesCsv(incomes: Income[]): string {
  const header = 'Date,Amount,Source,Description';
  const rows = incomes.map((i) => {
    const date = new Date(i.date).toLocaleDateString('en-US');
    return [
      date,
      i.amount.toFixed(2),
      escapeCsv(i.source),
      escapeCsv(i.description || ''),
    ].join(',');
  });
  return [header, ...rows].join('\n');
}

function buildFixedExpensesCsv(items: FixedExpense[]): string {
  const header = 'Amount,Category,Description';
  const rows = items.map((e) =>
    [e.amount.toFixed(2), escapeCsv(e.category), escapeCsv(e.description || '')].join(',')
  );
  return [header, ...rows].join('\n');
}

function buildFixedIncomesCsv(items: FixedIncome[]): string {
  const header = 'Amount,Source,Description';
  const rows = items.map((i) =>
    [i.amount.toFixed(2), escapeCsv(i.source), escapeCsv(i.description || '')].join(',')
  );
  return [header, ...rows].join('\n');
}

export function buildFullExport(data: {
  expenses: Expense[];
  incomes: Income[];
  fixedExpenses: FixedExpense[];
  fixedIncomes: FixedIncome[];
}): string {
  const sections = [
    '=== EXPENSES ===',
    buildExpensesCsv(data.expenses),
    '',
    '=== ONE-TIME INCOME ===',
    buildIncomesCsv(data.incomes),
    '',
    '=== RECURRING EXPENSES ===',
    buildFixedExpensesCsv(data.fixedExpenses),
    '',
    '=== RECURRING INCOME ===',
    buildFixedIncomesCsv(data.fixedIncomes),
  ];
  return sections.join('\n');
}

export async function exportCsv(data: {
  expenses: Expense[];
  incomes: Income[];
  fixedExpenses: FixedExpense[];
  fixedIncomes: FixedIncome[];
}): Promise<boolean> {
  const csv = buildFullExport(data);
  const filename = `WhereDidItGo_${new Date().toISOString().slice(0, 10)}.csv`;

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }

  // Native: use Share API with the CSV content
  try {
    await Share.share({
      message: csv,
      title: filename,
    });
    return true;
  } catch {
    return false;
  }
}
