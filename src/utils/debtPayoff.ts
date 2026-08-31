import { Debt, PayoffStrategy } from '../types';

export interface DebtPayoffMonth {
  month: number; // 1-based
  payments: {
    debtId: string;
    payment: number;
    principal: number;
    interest: number;
    remainingBalance: number;
  }[];
  totalPaid: number;
  totalRemaining: number;
}

export interface DebtPayoffResult {
  months: number;
  totalPaid: number;
  totalInterest: number;
  schedule: DebtPayoffMonth[];
  debtFreeDate: string; // YYYY-MM
  perDebtSummary: {
    debtId: string;
    name: string;
    originalBalance: number;
    totalPaid: number;
    totalInterest: number;
    monthsToPayoff: number;
  }[];
}

const MAX_MONTHS = 600; // 50 years cap

/**
 * Calculate debt payoff schedule using snowball or avalanche strategy.
 * @param debts - Array of debts
 * @param extraMonthly - Extra money above minimums to throw at debt each month
 * @param strategy - 'avalanche' (highest interest first) or 'snowball' (lowest balance first)
 */
export function calculatePayoff(
  debts: Debt[],
  extraMonthly: number,
  strategy: PayoffStrategy,
): DebtPayoffResult {
  if (debts.length === 0) {
    return { months: 0, totalPaid: 0, totalInterest: 0, schedule: [], debtFreeDate: '', perDebtSummary: [] };
  }

  // Working copy
  const working = debts.map((d) => ({
    id: d.id,
    name: d.name,
    originalBalance: d.balance,
    balance: d.balance,
    rate: d.interestRate / 100 / 12, // monthly interest rate
    minPayment: d.minimumPayment,
    totalPaid: 0,
    totalInterest: 0,
    paidOffMonth: 0,
  }));

  const schedule: DebtPayoffMonth[] = [];
  let month = 0;

  while (working.some((d) => d.balance > 0.01) && month < MAX_MONTHS) {
    month++;

    // Sort active debts by strategy to determine where extra payment goes
    const active = working.filter((d) => d.balance > 0.01);
    if (active.length === 0) break;

    if (strategy === 'avalanche') {
      active.sort((a, b) => b.rate - a.rate); // highest rate first
    } else {
      active.sort((a, b) => a.balance - b.balance); // lowest balance first
    }

    // Calculate minimum payments and interest first
    let extraBudget = extraMonthly;
    const monthPayments: DebtPayoffMonth['payments'] = [];

    for (const d of working) {
      if (d.balance <= 0.01) {
        monthPayments.push({ debtId: d.id, payment: 0, principal: 0, interest: 0, remainingBalance: 0 });
        continue;
      }

      const interest = d.balance * d.rate;
      const minPay = Math.min(d.minPayment, d.balance + interest);
      const principal = Math.max(0, minPay - interest);

      monthPayments.push({
        debtId: d.id,
        payment: minPay,
        principal,
        interest,
        remainingBalance: d.balance - principal,
      });

      d.balance = Math.max(0, d.balance - principal);
      d.totalPaid += minPay;
      d.totalInterest += interest;
    }

    // Apply extra payment to target debt (first in sorted active list)
    for (const target of active) {
      if (extraBudget <= 0) break;
      if (target.balance <= 0.01) continue;

      const extraPay = Math.min(extraBudget, target.balance);
      target.balance -= extraPay;
      target.totalPaid += extraPay;
      extraBudget -= extraPay;

      // Update the month payment entry
      const entry = monthPayments.find((p) => p.debtId === target.id);
      if (entry) {
        entry.payment += extraPay;
        entry.principal += extraPay;
        entry.remainingBalance = target.balance;
      }
    }

    // Update remaining balances in payment entries
    for (const d of working) {
      const entry = monthPayments.find((p) => p.debtId === d.id);
      if (entry) entry.remainingBalance = Math.max(0, d.balance);
    }

    // Mark payoff month
    for (const d of working) {
      if (d.balance <= 0.01 && d.paidOffMonth === 0) {
        d.paidOffMonth = month;
      }
    }

    schedule.push({
      month,
      payments: monthPayments,
      totalPaid: monthPayments.reduce((s, p) => s + p.payment, 0),
      totalRemaining: working.reduce((s, d) => s + Math.max(0, d.balance), 0),
    });
  }

  const now = new Date();
  const freeDate = new Date(now.getFullYear(), now.getMonth() + month);
  const debtFreeDate = `${freeDate.getFullYear()}-${String(freeDate.getMonth() + 1).padStart(2, '0')}`;

  return {
    months: month,
    totalPaid: working.reduce((s, d) => s + d.totalPaid, 0),
    totalInterest: working.reduce((s, d) => s + d.totalInterest, 0),
    schedule,
    debtFreeDate,
    perDebtSummary: working.map((d) => ({
      debtId: d.id,
      name: d.name,
      originalBalance: d.originalBalance,
      totalPaid: d.totalPaid,
      totalInterest: d.totalInterest,
      monthsToPayoff: d.paidOffMonth || month,
    })),
  };
}

/** Format months as "X years Y months" or just "X months" */
export function formatPayoffDuration(months: number): string {
  if (months === 0) return 'Debt free!';
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
  if (remaining === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years}y ${remaining}m`;
}
