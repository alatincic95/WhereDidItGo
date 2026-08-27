/**
 * Budget Sharing
 *
 * Share a single budget (with its linked expenses) as a JSON payload.
 * The recipient can import it and merge into their app.
 * No cloud needed — uses native share sheet or transfer codes.
 */

import { Platform, Share } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Budget, Expense } from '../types';

export interface SharedBudgetData {
  _meta: {
    type: 'shared-budget';
    app: 'WhereDidItGo';
    version: number;
    sharedAt: string;
    sharedBy?: string; // optional sender name
  };
  budget: Budget;
  expenses: Expense[];
}

const SHARE_VERSION = 1;

/**
 * Build the shared budget JSON payload.
 */
export function buildSharedBudgetJson(
  budget: Budget,
  expenses: Expense[],
  sharedBy?: string
): string {
  const data: SharedBudgetData = {
    _meta: {
      type: 'shared-budget',
      app: 'WhereDidItGo',
      version: SHARE_VERSION,
      sharedAt: new Date().toISOString(),
      sharedBy,
    },
    budget,
    expenses,
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Validate incoming shared budget JSON.
 */
export function validateSharedBudget(
  json: string
): { valid: true; data: SharedBudgetData } | { valid: false; error: string } {
  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { valid: false, error: 'Invalid JSON.' };
  }

  if (!parsed._meta || parsed._meta.type !== 'shared-budget' || parsed._meta.app !== 'WhereDidItGo') {
    return { valid: false, error: 'Not a WhereDidItGo shared budget.' };
  }

  if (!parsed.budget || !parsed.budget.id || !parsed.budget.name) {
    return { valid: false, error: 'Missing budget data.' };
  }

  if (!Array.isArray(parsed.expenses)) {
    return { valid: false, error: 'Missing expenses data.' };
  }

  return { valid: true, data: parsed as SharedBudgetData };
}

/**
 * Share a budget via the native share sheet (as a JSON file).
 */
export async function shareBudgetViaFile(
  budget: Budget,
  expenses: Expense[],
  sharedBy?: string
): Promise<boolean> {
  const json = buildSharedBudgetJson(budget, expenses, sharedBy);
  const safeName = budget.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  const filename = `Budget_${safeName}_${new Date().toISOString().slice(0, 10)}.json`;

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

  try {
    const file = new File(Paths.cache, filename);
    file.write(json);
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: `Share Budget: ${budget.name}`,
      UTI: 'public.json',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a transfer code (base64) for a shared budget.
 */
export function generateBudgetTransferCode(
  budget: Budget,
  expenses: Expense[],
  sharedBy?: string
): string {
  const json = buildSharedBudgetJson(budget, expenses, sharedBy);
  // Use btoa for base64 encoding (works on both web and RN)
  try {
    return btoa(unescape(encodeURIComponent(json)));
  } catch {
    // Fallback: return raw JSON if btoa fails
    return json;
  }
}

/**
 * Parse a transfer code back into shared budget data.
 */
export function parseBudgetTransferCode(
  code: string
): { valid: true; data: SharedBudgetData } | { valid: false; error: string } {
  let json: string;
  try {
    json = decodeURIComponent(escape(atob(code.trim())));
  } catch {
    // Maybe it's raw JSON
    json = code.trim();
  }
  return validateSharedBudget(json);
}
