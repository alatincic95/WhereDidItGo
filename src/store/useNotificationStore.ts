import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AppNotification, NotificationType, NOTIFICATION_TYPE_META } from '../types';
import { useExpenseStore } from './useExpenseStore';

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (type: NotificationType, title: string, message: string, relatedId?: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  deleteNotification: (id: string) => void;
  getUnreadCount: () => number;
  generateSmartNotifications: (data: {
    monthlyBudget: number;
    totalSpent: number;
    fixedTotal: number;
    projects: Array<{ id: string; name: string; budget?: number; spent: number; status: string }>;
    fixedExpenses: Array<{ description: string; amount: number }>;
  }) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
  notifications: [
    // Welcome notification
    {
      id: 'welcome',
      type: 'tip' as NotificationType,
      title: 'Welcome to WhereDidItGo!',
      message: 'Start tracking your expenses to get personalized insights and budget alerts.',
      icon: 'lightbulb',
      color: '#BB8FCE',
      read: false,
      createdAt: new Date().toISOString(),
    },
  ],

  addNotification: (type, title, message, relatedId) => {
    const meta = NOTIFICATION_TYPE_META[type];
    const notification: AppNotification = {
      id: Platform.OS === 'web' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      title,
      message,
      icon: meta.icon,
      color: meta.color,
      read: false,
      createdAt: new Date().toISOString(),
      relatedId,
    };
    set((state) => ({
      notifications: [notification, ...state.notifications],
    }));
  },

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearAll: () => set({ notifications: [] }),

  deleteNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },

  generateSmartNotifications: (data) => {
    const { notifications, addNotification } = get();
    const existingTypes = new Set(notifications.map((n) => `${n.type}-${n.relatedId || 'global'}`));

    const { monthlyBudget, totalSpent, fixedTotal, projects, fixedExpenses } = data;
    const allSpent = totalSpent + fixedTotal;
    const spendingRatio = monthlyBudget > 0 ? allSpent / monthlyBudget : 0;

    // Monthly budget warnings
    if (spendingRatio >= 1 && !existingTypes.has('budget_exceeded-global')) {
      addNotification(
        'budget_exceeded',
        'Budget Exceeded!',
        `You've spent ${formatCurrency(allSpent)} this month, exceeding your ${formatCurrency(monthlyBudget)} budget by ${formatCurrency(allSpent - monthlyBudget)}.`
      );
    } else if (spendingRatio >= 0.9 && spendingRatio < 1 && !existingTypes.has('budget_warning-90')) {
      addNotification(
        'budget_warning',
        'Almost at Budget Limit',
        `You've used ${Math.round(spendingRatio * 100)}% of your monthly budget. Only ${formatCurrency(monthlyBudget - allSpent)} remaining.`,
        '90'
      );
    } else if (spendingRatio >= 0.75 && spendingRatio < 0.9 && !existingTypes.has('budget_warning-75')) {
      addNotification(
        'budget_warning',
        '75% Budget Used',
        `You've spent ${formatCurrency(allSpent)} of your ${formatCurrency(monthlyBudget)} monthly budget. Consider slowing down spending.`,
        '75'
      );
    }

    // Project budget alerts
    projects.forEach((project) => {
      if (!project.budget || project.budget <= 0 || project.status !== 'active') return;
      const projectRatio = project.spent / project.budget;

      if (projectRatio >= 1 && !existingTypes.has(`project_budget_exceeded-${project.id}`)) {
        addNotification(
          'project_budget_exceeded',
          `${project.name} Over Budget`,
          `Project "${project.name}" has exceeded its ${formatCurrency(project.budget)} budget. Total spent: ${formatCurrency(project.spent)}.`,
          project.id
        );
      } else if (projectRatio >= 0.8 && projectRatio < 1 && !existingTypes.has(`project_budget_warning-${project.id}`)) {
        addNotification(
          'project_budget_warning',
          `${project.name} Nearing Budget`,
          `${Math.round(projectRatio * 100)}% of the budget for "${project.name}" has been used. ${formatCurrency(project.budget - project.spent)} remaining.`,
          project.id
        );
      }
    });

    // Bill reminders (beginning of month)
    const dayOfMonth = new Date().getDate();
    if (dayOfMonth <= 5 && fixedExpenses.length > 0 && !existingTypes.has('bill_reminder-monthly')) {
      const totalFixed = fixedExpenses.reduce((s, e) => s + e.amount, 0);
      addNotification(
        'bill_reminder',
        'Monthly Bills Due',
        `You have ${fixedExpenses.length} recurring expense${fixedExpenses.length > 1 ? 's' : ''} totaling ${formatCurrency(totalFixed)} this month.`,
        'monthly'
      );
    }

    // Milestones
    if (allSpent === 0 && !existingTypes.has('tip-start')) {
      addNotification(
        'tip',
        'Track Your First Expense',
        'Tap the + button on the dashboard to record your first expense and start building your financial picture.',
        'start'
      );
    }
  },
    }),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        notifications: state.notifications,
      }),
    }
  )
);

function formatCurrency(amount: number) {
  const symbol = useExpenseStore.getState().currencySymbol;
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
