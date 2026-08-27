import { Platform, Share } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Expense, FixedExpense, FixedIncome, Income, Budget, CustomCategory, ExchangeRate, SavingsGoal, BudgetTemplate, DashboardCardConfig } from '../types';

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

// ── Backup / Restore (JSON) ──────────────────────────────────────────

export interface BackupData {
  _meta: {
    app: string;
    version: number;
    exportedAt: string;
  };
  expenses: Expense[];
  fixedExpenses: FixedExpense[];
  incomes: Income[];
  fixedIncomes: FixedIncome[];
  budgets: Budget[];
  customCategories: CustomCategory[];
  exchangeRates: ExchangeRate[];
  savingsGoals: SavingsGoal[];
  budgetTemplates: BudgetTemplate[];
  dashboardCards?: DashboardCardConfig[];
  initialBalance: number;
  monthlyIncome: number;
  currencySymbol: string;
}

const BACKUP_VERSION = 1;

export function buildBackupJson(state: Omit<BackupData, '_meta'>): string {
  const backup: BackupData = {
    _meta: {
      app: 'WhereDidItGo',
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
    },
    ...state,
  };
  return JSON.stringify(backup, null, 2);
}

export function validateBackup(json: string): { valid: true; data: BackupData } | { valid: false; error: string } {
  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { valid: false, error: 'Invalid JSON file.' };
  }

  if (!parsed._meta || parsed._meta.app !== 'WhereDidItGo') {
    return { valid: false, error: 'Not a WhereDidItGo backup file.' };
  }

  if (!Array.isArray(parsed.expenses)) {
    return { valid: false, error: 'Backup is missing expenses data.' };
  }

  return { valid: true, data: parsed as BackupData };
}

export async function exportBackup(state: Omit<BackupData, '_meta'>): Promise<boolean> {
  const json = buildBackupJson(state);
  const filename = `WhereDidItGo_Backup_${new Date().toISOString().slice(0, 10)}.json`;

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
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

  // Native: write to temp file, then share
  try {
    const file = new File(Paths.cache, filename);
    file.write(json);
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Save Backup',
      UTI: 'public.json',
    });
    return true;
  } catch {
    return false;
  }
}

export async function pickAndReadBackupFile(): Promise<{ valid: true; data: BackupData } | { valid: false; error: string }> {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) {
          resolve({ valid: false, error: 'No file selected.' });
          return;
        }
        const text = await file.text();
        resolve(validateBackup(text));
      };
      input.click();
    });
  }

  // Native: use file picker
  try {
    const picked = await File.pickFileAsync(undefined, 'application/json');
    if (!picked) {
      return { valid: false, error: 'No file selected.' };
    }
    const file = Array.isArray(picked) ? picked[0] : picked;
    const content = await file.text();
    return validateBackup(content);
  } catch {
    return { valid: false, error: 'Failed to read the file.' };
  }
}
