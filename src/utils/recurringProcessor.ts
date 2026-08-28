import { RecurringFrequency } from '../types';

/**
 * Generate a deterministic ID for an auto-generated recurring entry.
 * Using a fixed prefix + source ID + date ensures idempotency.
 */
export function generateRecurringId(fixedId: string, dateStr: string): string {
  return `recurring-${fixedId}-${dateStr}`;
}

/**
 * Compute all due dates for a recurring item between (lastProcessed, today].
 * If lastProcessed is not set, uses startDate as the first due date.
 */
export function computeDueDates(
  frequency: RecurringFrequency,
  startDate: string,
  lastProcessedDate: string | undefined,
  today: Date
): string[] {
  const dates: string[] = [];
  const todayStr = formatDate(today);

  // Start generating from the day AFTER lastProcessedDate, or from startDate
  let cursor: Date;
  if (lastProcessedDate) {
    cursor = advanceByFrequency(parseDate(lastProcessedDate), frequency);
  } else {
    cursor = parseDate(startDate);
  }

  // Generate due dates up to and including today
  while (formatDate(cursor) <= todayStr) {
    dates.push(formatDate(cursor));
    cursor = advanceByFrequency(cursor, frequency);
  }

  return dates;
}

function advanceByFrequency(date: Date, frequency: RecurringFrequency): Date {
  const d = new Date(date);
  switch (frequency) {
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'biweekly':
      d.setDate(d.getDate() + 14);
      break;
    case 'monthly': {
      const origDay = d.getDate();
      d.setMonth(d.getMonth() + 1);
      if (d.getDate() < origDay) d.setDate(0); // clamp to last day of target month
      break;
    }
    case 'quarterly': {
      const origDay = d.getDate();
      d.setMonth(d.getMonth() + 3);
      if (d.getDate() < origDay) d.setDate(0);
      break;
    }
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d;
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
