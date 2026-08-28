import { Platform } from 'react-native';
import { File } from 'expo-file-system';

interface CsvImportResult {
  expenses: Array<{ amount: number; category: string; description: string; date: string }>;
  incomes: Array<{ amount: number; source: string; description: string; date: string }>;
  fixedExpenses: Array<{ amount: number; category: string; description: string }>;
  fixedIncomes: Array<{ amount: number; source: string; description: string }>;
}

function parseCsvRow(row: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (inQuotes) {
      if (ch === '"' && row[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseDate(dateStr: string): string {
  // Try parsing M/D/YYYY format (from toLocaleDateString) or ISO format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [m, d, y] = parts.map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0);
    if (!isNaN(date.getTime())) return date.toISOString();
  }
  // Try ISO
  const iso = new Date(dateStr);
  if (!isNaN(iso.getTime())) return iso.toISOString();
  return new Date().toISOString();
}

export function parseCsvImport(csv: string): { valid: true; data: CsvImportResult; stats: string } | { valid: false; error: string } {
  const lines = csv.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { valid: false, error: 'Empty CSV file.' };
  }

  let currentSection = '';
  const result: CsvImportResult = {
    expenses: [],
    incomes: [],
    fixedExpenses: [],
    fixedIncomes: [],
  };

  for (const line of lines) {
    // Section markers
    if (line.startsWith('=== EXPENSES ===')) { currentSection = 'expenses'; continue; }
    if (line.startsWith('=== ONE-TIME INCOME ===')) { currentSection = 'incomes'; continue; }
    if (line.startsWith('=== RECURRING EXPENSES ===')) { currentSection = 'fixedExpenses'; continue; }
    if (line.startsWith('=== RECURRING INCOME ===')) { currentSection = 'fixedIncomes'; continue; }

    // Skip header rows
    if (line.startsWith('Date,Amount,Currency,Category')) continue;
    if (line.startsWith('Date,Amount,Source')) continue;
    if (line.startsWith('Amount,Category,Description')) continue;
    if (line.startsWith('Amount,Source,Description')) continue;

    const fields = parseCsvRow(line);

    if (currentSection === 'expenses' && fields.length >= 5) {
      const amount = parseFloat(fields[1]);
      if (isNaN(amount) || amount <= 0) continue;
      result.expenses.push({
        amount,
        category: fields[3] || 'Other',
        description: fields[4] || '',
        date: parseDate(fields[0]),
      });
    } else if (currentSection === 'incomes' && fields.length >= 3) {
      const amount = parseFloat(fields[1]);
      if (isNaN(amount) || amount <= 0) continue;
      result.incomes.push({
        amount,
        source: fields[2] || 'Other',
        description: fields[3] || '',
        date: parseDate(fields[0]),
      });
    } else if (currentSection === 'fixedExpenses' && fields.length >= 2) {
      const amount = parseFloat(fields[0]);
      if (isNaN(amount) || amount <= 0) continue;
      result.fixedExpenses.push({
        amount,
        category: fields[1] || 'Other',
        description: fields[2] || '',
      });
    } else if (currentSection === 'fixedIncomes' && fields.length >= 2) {
      const amount = parseFloat(fields[0]);
      if (isNaN(amount) || amount <= 0) continue;
      result.fixedIncomes.push({
        amount,
        source: fields[1] || 'Other',
        description: fields[2] || '',
      });
    }
  }

  const total = result.expenses.length + result.incomes.length + result.fixedExpenses.length + result.fixedIncomes.length;

  if (total === 0) {
    return { valid: false, error: 'No valid data found in CSV. Make sure it uses the WhereDidItGo export format.' };
  }

  const stats = [
    result.expenses.length > 0 ? `${result.expenses.length} expenses` : '',
    result.incomes.length > 0 ? `${result.incomes.length} incomes` : '',
    result.fixedExpenses.length > 0 ? `${result.fixedExpenses.length} recurring expenses` : '',
    result.fixedIncomes.length > 0 ? `${result.fixedIncomes.length} recurring incomes` : '',
  ].filter(Boolean).join(', ');

  return { valid: true, data: result, stats };
}

export async function pickAndReadCsvFile(): Promise<{ valid: true; data: CsvImportResult; stats: string } | { valid: false; error: string }> {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,text/csv';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) {
          resolve({ valid: false, error: 'No file selected.' });
          return;
        }
        const text = await file.text();
        resolve(parseCsvImport(text));
      };
      input.click();
    });
  }

  try {
    const picked = await File.pickFileAsync(undefined, 'text/csv');
    if (!picked) {
      return { valid: false, error: 'No file selected.' };
    }
    const file = Array.isArray(picked) ? picked[0] : picked;
    const content = await file.text();
    return parseCsvImport(content);
  } catch {
    return { valid: false, error: 'Failed to read the file.' };
  }
}
