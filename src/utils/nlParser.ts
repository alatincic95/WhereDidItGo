/**
 * Natural Language Expense Parser
 *
 * Parses free-form text into expense components.
 * Examples:
 *   "coffee 4.50"           → { amount: 4.50, description: "coffee" }
 *   "uber 23 transport"     → { amount: 23, description: "uber", categoryHint: "transport" }
 *   "45.99 grocery shopping" → { amount: 45.99, description: "grocery shopping" }
 *   "$12 lunch"             → { amount: 12, description: "lunch" }
 *   "rent 1200/month"       → { amount: 1200, description: "rent" }
 */

export interface ParsedExpense {
  amount: number | null;
  description: string;
  categoryHint: string | null; // raw text hint, not yet resolved to ExpenseCategory
}

// Common currency symbols to strip from amount parsing
const CURRENCY_SYMBOLS = /^[$€£¥₹₽₩₪₴₺₿kr]/;

// Category keywords that might appear in the input
const CATEGORY_KEYWORDS: Record<string, string> = {
  food: 'Food',
  groceries: 'Food',
  grocery: 'Food',
  restaurant: 'Food',
  lunch: 'Food',
  dinner: 'Food',
  breakfast: 'Food',
  snack: 'Food',
  coffee: 'Food',
  cafe: 'Food',
  transport: 'Transport',
  transportation: 'Transport',
  uber: 'Transport',
  lyft: 'Transport',
  taxi: 'Transport',
  cab: 'Transport',
  bus: 'Transport',
  train: 'Transport',
  gas: 'Transport',
  fuel: 'Transport',
  parking: 'Transport',
  toll: 'Transport',
  metro: 'Transport',
  subway: 'Transport',
  housing: 'Housing',
  rent: 'Housing',
  mortgage: 'Housing',
  maintenance: 'Housing',
  repair: 'Housing',
  furniture: 'Housing',
  entertainment: 'Entertainment',
  movie: 'Entertainment',
  movies: 'Entertainment',
  cinema: 'Entertainment',
  concert: 'Entertainment',
  game: 'Entertainment',
  games: 'Entertainment',
  gaming: 'Entertainment',
  streaming: 'Entertainment',
  bar: 'Entertainment',
  club: 'Entertainment',
  party: 'Entertainment',
  shopping: 'Shopping',
  clothes: 'Shopping',
  clothing: 'Shopping',
  shoes: 'Shopping',
  amazon: 'Shopping',
  online: 'Shopping',
  health: 'Health',
  doctor: 'Health',
  hospital: 'Health',
  pharmacy: 'Health',
  medicine: 'Health',
  gym: 'Health',
  dentist: 'Health',
  therapy: 'Health',
  education: 'Education',
  school: 'Education',
  course: 'Education',
  book: 'Education',
  books: 'Education',
  tuition: 'Education',
  class: 'Education',
  tutorial: 'Education',
  bills: 'Bills',
  bill: 'Bills',
  electricity: 'Bills',
  electric: 'Bills',
  water: 'Bills',
  internet: 'Bills',
  phone: 'Bills',
  mobile: 'Bills',
  insurance: 'Bills',
  utility: 'Bills',
  utilities: 'Bills',
  subscription: 'Subscriptions',
  subscriptions: 'Subscriptions',
  netflix: 'Subscriptions',
  spotify: 'Subscriptions',
  hulu: 'Subscriptions',
  disney: 'Subscriptions',
  hbo: 'Subscriptions',
  youtube: 'Subscriptions',
  membership: 'Subscriptions',
  premium: 'Subscriptions',
};

/**
 * Parse a free-form text input into structured expense data.
 *
 * Handles these patterns:
 * - "description amount"      → "coffee 4.50"
 * - "amount description"      → "4.50 coffee"
 * - "$amount description"     → "$12 lunch"
 * - "description amount cat"  → "uber 23 transport"
 * - "amount"                  → "45.99"
 */
export function parseExpenseText(input: string): ParsedExpense {
  const trimmed = input.trim();
  if (!trimmed) {
    return { amount: null, description: '', categoryHint: null };
  }

  // Tokenize, preserving order
  const tokens = trimmed.split(/\s+/);

  // Find amount token(s) — look for numbers, optionally prefixed with currency symbol
  let amountIndex = -1;
  let amount: number | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const cleaned = tokens[i].replace(CURRENCY_SYMBOLS, '').replace(/,/g, '');
    // Match numbers like "4.50", "1200", "45,99" (after comma removal)
    if (/^\d+(\.\d{0,2})?$/.test(cleaned)) {
      amount = parseFloat(cleaned);
      amountIndex = i;
      break;
    }
  }

  // Remaining tokens (excluding amount) form description + potential category hint
  const remainingTokens = tokens.filter((_, i) => i !== amountIndex);

  // Check if any remaining token is a category keyword
  let categoryHint: string | null = null;
  const descriptionTokens: string[] = [];

  for (const token of remainingTokens) {
    const lower = token.toLowerCase().replace(/[^a-z]/g, '');
    if (CATEGORY_KEYWORDS[lower] && !categoryHint) {
      categoryHint = CATEGORY_KEYWORDS[lower];
      // Still include it in description — the category hint is separate
      descriptionTokens.push(token);
    } else {
      descriptionTokens.push(token);
    }
  }

  const description = descriptionTokens.join(' ');

  return {
    amount,
    description,
    categoryHint,
  };
}

/**
 * Check if a text input looks like it has enough info to create an expense.
 * At minimum needs an amount.
 */
export function isValidQuickExpense(parsed: ParsedExpense): boolean {
  return parsed.amount !== null && parsed.amount > 0;
}

/**
 * Get category hint from description text alone (for use in AddExpenseScreen).
 * Returns the category name or null.
 */
export function getCategoryFromText(text: string): string | null {
  const words = text.toLowerCase().split(/\s+/);
  for (const word of words) {
    const cleaned = word.replace(/[^a-z]/g, '');
    if (CATEGORY_KEYWORDS[cleaned]) {
      return CATEGORY_KEYWORDS[cleaned];
    }
  }
  return null;
}
