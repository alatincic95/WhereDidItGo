import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { FixedExpense, FREQUENCY_TO_MONTHLY } from '../types';

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
 * Cancel all scheduled notifications.
 */
export async function cancelAllScheduled(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
