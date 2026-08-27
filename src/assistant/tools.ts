import { ToolDefinition } from './types';

export const ASSISTANT_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'add_expense',
      description: 'Add a new expense. Use when the user wants to log/add/record a one-time expense.',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'The expense amount' },
          description: { type: 'string', description: 'What the expense is for (e.g. "coffee", "groceries", "uber ride")' },
          category: {
            type: 'string',
            description: 'Expense category. Pick the most appropriate one based on the description.',
            enum: ['Food', 'Transport', 'Housing', 'Entertainment', 'Shopping', 'Health', 'Education', 'Bills', 'Subscriptions', 'Other'],
          },
          date: { type: 'string', description: 'ISO date string. Defaults to today if not specified.' },
        },
        required: ['amount', 'description', 'category'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_recurring_expense',
      description: 'Add a recurring/fixed expense that repeats on a schedule (e.g. rent, subscriptions, bills).',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'The expense amount per period' },
          description: { type: 'string', description: 'What the recurring expense is for' },
          category: {
            type: 'string',
            description: 'Expense category',
            enum: ['Food', 'Transport', 'Housing', 'Entertainment', 'Shopping', 'Health', 'Education', 'Bills', 'Subscriptions', 'Other'],
          },
          frequency: {
            type: 'string',
            description: 'How often this expense recurs',
            enum: ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
          },
        },
        required: ['amount', 'description', 'category', 'frequency'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_income',
      description: 'Add a one-time income entry (e.g. gift, bonus, freelance payment, refund).',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'The income amount' },
          description: { type: 'string', description: 'Description of the income' },
          source: {
            type: 'string',
            description: 'Income source type',
            enum: ['Gift', 'Bonus', 'Freelance', 'Sale', 'Refund', 'Investment', 'Other'],
          },
        },
        required: ['amount', 'description', 'source'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_monthly_income',
      description: 'Set the base monthly income amount.',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'The new monthly income amount' },
        },
        required: ['amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_savings_goal',
      description: 'Create a new savings goal.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the savings goal (e.g. "Vacation", "Emergency Fund")' },
          targetAmount: { type: 'number', description: 'Target amount to save' },
          deadline: { type: 'string', description: 'Optional deadline as ISO date string' },
        },
        required: ['name', 'targetAmount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_to_savings',
      description: 'Add funds to an existing savings goal.',
      parameters: {
        type: 'object',
        properties: {
          goalName: { type: 'string', description: 'Name of the savings goal to add funds to' },
          amount: { type: 'number', description: 'Amount to add' },
        },
        required: ['goalName', 'amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_balance',
      description: 'Get the current monthly and overall balance. Use when the user asks about their balance, how much they have left, or financial status.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_monthly_spending',
      description: 'Get total spending for a specific month. Use when the user asks how much they spent.',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'string', description: 'Month in YYYY-MM format. Defaults to current month.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_category_breakdown',
      description: 'Get spending breakdown by category for a month. Use when the user asks about spending by category or on a specific category.',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'string', description: 'Month in YYYY-MM format. Defaults to current month.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_budgets',
      description: 'Get all active budgets with their spending progress.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_savings_goals',
      description: 'Get all savings goals with their progress.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_expenses',
      description: 'Get the most recent expenses.',
      parameters: {
        type: 'object',
        properties: {
          count: { type: 'number', description: 'Number of recent expenses to return. Defaults to 5.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recurring_expenses',
      description: 'Get all recurring/fixed expenses.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_last_expense',
      description: 'Delete the most recent expense. Only use when the user explicitly asks to delete or undo their last expense.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];
