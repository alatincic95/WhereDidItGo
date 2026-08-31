import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { FixedExpense, FixedIncome, FREQUENCY_TO_MONTHLY } from '../types';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions. Returns true if granted.
 */
export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Check if notification permissions are currently granted.
 */
export async function hasPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule a local notification with the given title and body.
 * Returns the notification identifier for cancellation.
 */
export async function scheduleNotification(
  title: string,
  body: string,
  identifier?: string,
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    // Cancel existing notification with same identifier to prevent duplicates
    if (identifier) {
      await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
    }
    return await Notifications.scheduleNotificationAsync({
      identifier,
      content: { title, body, sound: true },
      trigger: null, // fire immediately
    });
  } catch {
    return null;
  }
}

/**
 * Schedule bill reminder notifications for the beginning of next month (days 1-5).
 * Idempotent: cancels previous reminders before scheduling new ones.
 */
export async function scheduleBillReminders(
  fixedExpenses: FixedExpense[],
  currencySymbol: string,
): Promise<void> {
  if (Platform.OS === 'web') return;
  if (fixedExpenses.length === 0) return;

  const reminderId = 'bill-reminder-monthly';
  await Notifications.cancelScheduledNotificationAsync(reminderId).catch(() => {});

  const total = fixedExpenses.reduce((sum, e) => {
    const multiplier = FREQUENCY_TO_MONTHLY[e.frequency || 'monthly'];
    return sum + e.amount * multiplier;
  }, 0);

  const now = new Date();
  // Schedule for 1st of next month at 9:00 AM
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0);
  const secondsUntil = Math.max(1, Math.floor((nextMonth.getTime() - now.getTime()) / 1000));

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: reminderId,
      content: {
        title: 'Bill Reminder',
        body: `You have ${fixedExpenses.length} recurring expenses totaling ${currencySymbol}${total.toFixed(0)}/month`,
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secondsUntil },
    });
  } catch {
    // Silently fail — user experience unaffected
  }
}

/**
 * Schedule a budget threshold alert as a local notification.
 */
export async function scheduleBudgetAlert(
  title: string,
  body: string,
  identifier: string,
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: { title, body, sound: true },
      trigger: null, // fire immediately
    });
  } catch {
    // Silently fail
  }
}

/**
 * Schedule a monthly recap notification for the last day of the current month at 8 PM.
 * Summarizes total spending and comparison to previous month.
 */
export async function scheduleMonthlyRecap(): Promise<void> {
  if (Platform.OS === 'web') return;

  const recapId = 'monthly-recap';
  await Notifications.cancelScheduledNotificationAsync(recapId).catch(() => {});

  const now = new Date();
  // Schedule for last day of current month at 20:00
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 20, 0, 0);
  if (lastDay <= now) return; // already past

  const secondsUntil = Math.max(1, Math.floor((lastDay.getTime() - now.getTime()) / 1000));

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: recapId,
      content: {
        title: 'Monthly Spending Recap',
        body: 'Tap to see your spending summary for this month',
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secondsUntil },
    });
  } catch {
    // Silently fail
  }
}

/**
 * Schedule a backup reminder if the user hasn't backed up in 7+ days.
 * Fires 7 days after lastBackupDate, or immediately if never backed up.
 */
export async function scheduleBackupReminder(lastBackupDate: string | null): Promise<void> {
  if (Platform.OS === 'web') return;

  const reminderId = 'backup-reminder';
  await Notifications.cancelScheduledNotificationAsync(reminderId).catch(() => {});

  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  if (!lastBackupDate) {
    // Never backed up — remind in 1 day
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: reminderId,
        content: {
          title: 'Backup Reminder',
          body: "You haven't backed up your financial data yet. Tap to protect your data.",
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 86400 },
      });
    } catch {}
    return;
  }

  const lastDate = new Date(lastBackupDate).getTime();
  const nextReminder = lastDate + sevenDays;

  if (nextReminder <= now) {
    // Overdue — remind in 1 hour
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: reminderId,
        content: {
          title: 'Backup Reminder',
          body: "It's been over a week since your last backup. Tap to back up your data.",
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3600 },
      });
    } catch {}
  } else {
    const secondsUntil = Math.max(1, Math.floor((nextReminder - now) / 1000));
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: reminderId,
        content: {
          title: 'Backup Reminder',
          body: "It's been a week since your last backup. Tap to back up your data.",
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secondsUntil },
      });
    } catch {}
  }
}

/**
 * Schedule due date reminders for recurring expenses and incomes.
 * Fires `leadDays` days before each item's `dueDay` each month.
 */
export async function scheduleDueDateReminders(
  fixedExpenses: FixedExpense[],
  fixedIncomes: FixedIncome[],
  leadDays: number,
  currencySymbol: string,
): Promise<void> {
  if (Platform.OS === 'web') return;

  const now = new Date();
  const items: { id: string; description: string; amount: number; dueDay: number; type: 'expense' | 'income' }[] = [];

  fixedExpenses.filter((e) => !e.paused && e.dueDay).forEach((e) => {
    items.push({ id: e.id, description: e.description, amount: e.amount, dueDay: e.dueDay!, type: 'expense' });
  });
  fixedIncomes.filter((i) => !i.paused && i.dueDay).forEach((i) => {
    items.push({ id: i.id, description: i.description, amount: i.amount, dueDay: i.dueDay!, type: 'income' });
  });

  for (const item of items) {
    const identifier = `due-reminder-${item.id}`;
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

    // Calculate next due date
    let dueDate = new Date(now.getFullYear(), now.getMonth(), item.dueDay, 9, 0, 0);
    if (dueDate.getDate() !== item.dueDay) {
      // Day doesn't exist in this month (e.g., 31 in Feb), use last day
      dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 9, 0, 0);
    }
    // If due date already passed this month, schedule for next month
    if (dueDate.getTime() - leadDays * 86400000 < now.getTime()) {
      dueDate = new Date(now.getFullYear(), now.getMonth() + 1, item.dueDay, 9, 0, 0);
      if (dueDate.getDate() !== item.dueDay) {
        dueDate = new Date(now.getFullYear(), now.getMonth() + 2, 0, 9, 0, 0);
      }
    }

    const reminderDate = new Date(dueDate.getTime() - leadDays * 86400000);
    const secondsUntil = Math.max(1, Math.floor((reminderDate.getTime() - now.getTime()) / 1000));

    const typeLabel = item.type === 'expense' ? 'Bill' : 'Income';
    try {
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: `Upcoming ${typeLabel}: ${item.description}`,
          body: `${currencySymbol}${item.amount.toLocaleString()} due on the ${item.dueDay}${getOrdinalSuffix(item.dueDay)}`,
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secondsUntil },
      });
    } catch {}
  }
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllScheduled(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
