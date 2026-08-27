import { useExpenseStore } from '../store/useExpenseStore';
import { formatCurrency } from '../utils/currency';
import { getCurrentMonth } from '../components/dashboard/helpers';
import { IncomeSource, FREQUENCY_OPTIONS } from '../types';
import { ToolResult } from './types';

export function executeToolCall(name: string, args: Record<string, any>): ToolResult {
  const store = useExpenseStore.getState();
  const currentMonth = getCurrentMonth();

  try {
    switch (name) {
      case 'add_expense': {
        const { amount, description, category, date } = args;
        store.addExpense({
          amount,
          description,
          category: category || 'Other',
          date: date || new Date().toISOString(),
          isFixed: false,
        });
        return {
          tool: name,
          success: true,
          message: `Added expense: ${description} ${formatCurrency(amount)} in ${category || 'Other'}`,
        };
      }

      case 'add_recurring_expense': {
        const { amount, description, category, frequency } = args;
        store.addFixedExpense({
          amount,
          description,
          category: category || 'Other',
          frequency: frequency || 'monthly',
        });
        const freqLabel = FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.label || frequency;
        return {
          tool: name,
          success: true,
          message: `Added recurring expense: ${description} ${formatCurrency(amount)} (${freqLabel})`,
        };
      }

      case 'add_income': {
        const { amount, description, source } = args;
        store.addIncome({
          amount,
          description,
          source: (source || 'Other') as IncomeSource,
          date: new Date().toISOString(),
        });
        return {
          tool: name,
          success: true,
          message: `Added income: ${description} ${formatCurrency(amount)} (${source || 'Other'})`,
        };
      }

      case 'set_monthly_income': {
        const { amount } = args;
        store.setMonthlyIncome(amount);
        return {
          tool: name,
          success: true,
          message: `Monthly income set to ${formatCurrency(amount)}`,
        };
      }

      case 'add_savings_goal': {
        const { name: goalName, targetAmount, deadline } = args;
        store.addSavingsGoal({
          name: goalName,
          targetAmount,
          currentAmount: 0,
          color: '#6C63FF',
          icon: 'savings',
          deadline: deadline || undefined,
        });
        return {
          tool: name,
          success: true,
          message: `Created savings goal "${goalName}" with target ${formatCurrency(targetAmount)}`,
        };
      }

      case 'add_to_savings': {
        const { goalName, amount } = args;
        const goal = store.savingsGoals.find(
          (g) => g.name.toLowerCase() === goalName.toLowerCase()
        );
        if (!goal) {
          return {
            tool: name,
            success: false,
            message: `No savings goal found named "${goalName}". Available goals: ${store.savingsGoals.map((g) => g.name).join(', ') || 'none'}`,
          };
        }
        store.addToSavingsGoal(goal.id, amount);
        return {
          tool: name,
          success: true,
          message: `Added ${formatCurrency(amount)} to "${goal.name}". New total: ${formatCurrency(goal.currentAmount + amount)}/${formatCurrency(goal.targetAmount)}`,
        };
      }

      case 'get_balance': {
        const monthlyBalance = store.getMonthlyBalance(currentMonth);
        const overallBalance = store.getOverallBalance();
        return {
          tool: name,
          success: true,
          message: `Your monthly balance is ${formatCurrency(monthlyBalance)} and your overall balance is ${formatCurrency(overallBalance)}. Base monthly income: ${formatCurrency(store.monthlyIncome)}.`,
        };
      }

      case 'get_monthly_spending': {
        const month = args.month || currentMonth;
        const total = store.getMonthlyTotal(month);
        const fixedTotal = store.getFixedExpensesTotal();
        const monthLabel = new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return {
          tool: name,
          success: true,
          message: `Spending for ${monthLabel}: ${formatCurrency(total + fixedTotal)} total (${formatCurrency(total)} one-time + ${formatCurrency(fixedTotal)} recurring).`,
        };
      }

      case 'get_category_breakdown': {
        const month = args.month || currentMonth;
        const totals = store.getCategoryTotals(month);
        const sorted = Object.entries(totals)
          .sort(([, a], [, b]) => b - a);
        if (sorted.length === 0) {
          return { tool: name, success: true, message: 'No expenses recorded this month.' };
        }
        const lines = sorted.map(([cat, total]) => `• ${cat}: ${formatCurrency(total)}`);
        return {
          tool: name,
          success: true,
          message: `Category breakdown:\n${lines.join('\n')}`,
        };
      }

      case 'get_budgets': {
        const budgets = store.budgets.filter((b) => b.status === 'active');
        if (budgets.length === 0) {
          return { tool: name, success: true, message: 'No active budgets.' };
        }
        const lines = budgets.map((b) => {
          const spent = store.getBudgetTotal(b.id);
          const limit = b.budget ? formatCurrency(b.budget) : 'no limit';
          return `• ${b.name} — ${formatCurrency(spent)}/${limit}`;
        });
        return {
          tool: name,
          success: true,
          message: `Active budgets:\n${lines.join('\n')}`,
        };
      }

      case 'get_savings_goals': {
        const goals = store.savingsGoals;
        if (goals.length === 0) {
          return { tool: name, success: true, message: 'No savings goals set up yet.' };
        }
        const lines = goals.map((g) => {
          const pct = Math.round((g.currentAmount / g.targetAmount) * 100);
          return `• ${g.name} — ${formatCurrency(g.currentAmount)}/${formatCurrency(g.targetAmount)} (${pct}%)`;
        });
        return {
          tool: name,
          success: true,
          message: `Savings goals:\n${lines.join('\n')}`,
        };
      }

      case 'get_recent_expenses': {
        const count = args.count || 5;
        const expenses = [...store.expenses]
          .filter((e) => !e.isFixed)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, count);
        if (expenses.length === 0) {
          return { tool: name, success: true, message: 'No expenses recorded yet.' };
        }
        const lines = expenses.map((e) => {
          const date = new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return `• ${e.description} — ${formatCurrency(e.amount)} (${e.category}, ${date})`;
        });
        return {
          tool: name,
          success: true,
          message: `Recent expenses:\n${lines.join('\n')}`,
        };
      }

      case 'get_recurring_expenses': {
        const recurring = store.fixedExpenses;
        const recurringIncome = store.fixedIncomes;
        const parts: string[] = [];
        if (recurring.length > 0) {
          const lines = recurring.map((e) => {
            const freq = e.frequency || 'monthly';
            return `• ${e.description} — ${formatCurrency(e.amount)}/${freq} (${e.category})`;
          });
          parts.push(`Recurring expenses:\n${lines.join('\n')}`);
        } else {
          parts.push('No recurring expenses.');
        }
        if (recurringIncome.length > 0) {
          const lines = recurringIncome.map((i) => {
            const freq = i.frequency || 'monthly';
            return `• ${i.description} — ${formatCurrency(i.amount)}/${freq}`;
          });
          parts.push(`Recurring income:\n${lines.join('\n')}`);
        }
        return {
          tool: name,
          success: true,
          message: parts.join('\n\n'),
        };
      }

      case 'delete_last_expense': {
        const sorted = [...store.expenses]
          .filter((e) => !e.isFixed)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (sorted.length === 0) {
          return { tool: name, success: false, message: 'No expenses to delete.' };
        }
        const last = sorted[0];
        store.deleteExpense(last.id);
        return {
          tool: name,
          success: true,
          message: `Deleted expense: ${last.description} ${formatCurrency(last.amount)} (${last.category})`,
        };
      }

      default:
        return { tool: name, success: false, message: `Unknown tool: ${name}` };
    }
  } catch (error: any) {
    return { tool: name, success: false, message: `Error: ${error.message || 'Something went wrong'}` };
  }
}
