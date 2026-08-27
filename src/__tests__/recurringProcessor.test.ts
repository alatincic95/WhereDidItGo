import { computeDueDates, generateRecurringId } from '../utils/recurringProcessor';

describe('generateRecurringId', () => {
  it('produces a deterministic ID from fixedId and date', () => {
    expect(generateRecurringId('f1', '2026-08-01')).toBe('recurring-f1-2026-08-01');
  });

  it('produces different IDs for different dates', () => {
    const a = generateRecurringId('f1', '2026-08-01');
    const b = generateRecurringId('f1', '2026-09-01');
    expect(a).not.toBe(b);
  });

  it('produces different IDs for different source IDs', () => {
    const a = generateRecurringId('f1', '2026-08-01');
    const b = generateRecurringId('f2', '2026-08-01');
    expect(a).not.toBe(b);
  });
});

describe('computeDueDates', () => {
  it('generates monthly dates from startDate when no lastProcessed', () => {
    const today = new Date(2026, 10, 15); // Nov 15 2026
    const dates = computeDueDates('monthly', '2026-08-01', undefined, today);
    expect(dates).toEqual(['2026-08-01', '2026-09-01', '2026-10-01', '2026-11-01']);
  });

  it('generates dates from day after lastProcessed', () => {
    const today = new Date(2026, 9, 15); // Oct 15 2026
    const dates = computeDueDates('monthly', '2026-08-01', '2026-08-01', today);
    expect(dates).toEqual(['2026-09-01', '2026-10-01']);
  });

  it('returns empty array if nothing is due', () => {
    const today = new Date(2026, 7, 1); // Aug 1 2026
    const dates = computeDueDates('monthly', '2026-09-01', undefined, today);
    expect(dates).toEqual([]);
  });

  it('handles weekly frequency', () => {
    const today = new Date(2026, 7, 22); // Aug 22 2026
    const dates = computeDueDates('weekly', '2026-08-01', undefined, today);
    expect(dates).toEqual(['2026-08-01', '2026-08-08', '2026-08-15', '2026-08-22']);
  });

  it('handles biweekly frequency', () => {
    const today = new Date(2026, 7, 30); // Aug 30 2026
    const dates = computeDueDates('biweekly', '2026-08-01', undefined, today);
    expect(dates).toEqual(['2026-08-01', '2026-08-15', '2026-08-29']);
  });

  it('handles quarterly frequency', () => {
    const today = new Date(2027, 1, 15); // Feb 15 2027
    const dates = computeDueDates('quarterly', '2026-08-01', undefined, today);
    expect(dates).toEqual(['2026-08-01', '2026-11-01', '2027-02-01']);
  });

  it('handles yearly frequency', () => {
    const today = new Date(2028, 8, 1); // Sep 1 2028
    const dates = computeDueDates('yearly', '2026-08-01', undefined, today);
    expect(dates).toEqual(['2026-08-01', '2027-08-01', '2028-08-01']);
  });

  it('includes today if it falls on a due date', () => {
    const today = new Date(2026, 8, 1); // Sep 1 2026
    const dates = computeDueDates('monthly', '2026-08-01', '2026-08-01', today);
    expect(dates).toEqual(['2026-09-01']);
  });
});
