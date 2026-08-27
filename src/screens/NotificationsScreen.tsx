import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotificationStore } from '../store/useNotificationStore';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
} from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { AppNotification } from '../types';

const formatTimeAgo = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const groupNotifications = (notifications: AppNotification[]) => {
  const today: AppNotification[] = [];
  const earlier: AppNotification[] = [];
  const now = new Date();

  notifications.forEach((n) => {
    const date = new Date(n.createdAt);
    if (date.toDateString() === now.toDateString()) {
      today.push(n);
    } else {
      earlier.push(n);
    }
  });

  const groups: { title: string; data: AppNotification[] }[] = [];
  if (today.length > 0) groups.push({ title: 'Today', data: today });
  if (earlier.length > 0) groups.push({ title: 'Earlier', data: earlier });
  return groups;
};

export const NotificationsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    clearAll,
    deleteNotification,
    getUnreadCount,
  } = useNotificationStore();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef(
    notifications.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    itemAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 50 + index * 60,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const unreadCount = getUnreadCount();
  const groups = groupNotifications(notifications);

  const handleNotificationPress = (item: AppNotification) => {
    markAsRead(item.id);
    setSelectedNotification(item);
  };

  const getNavigationTarget = (item: AppNotification): { label: string; action: () => void } | null => {
    switch (item.type) {
      case 'budget_warning':
      case 'budget_exceeded':
        return { label: 'View Dashboard', action: () => navigation.navigate('Main', { screen: 'Dashboard' }) };
      case 'project_budget_warning':
      case 'project_budget_exceeded':
        if (item.relatedId) {
          return { label: 'View Budget', action: () => navigation.navigate('BudgetDetail', { projectId: item.relatedId }) };
        }
        return { label: 'View Budgets', action: () => navigation.navigate('Main', { screen: 'Budgets' }) };
      case 'category_budget_warning':
      case 'category_budget_exceeded':
        return { label: 'View Category Budgets', action: () => navigation.navigate('CategoryBudgets') };
      case 'bill_reminder':
        return { label: 'View Recurring', action: () => navigation.navigate('Main', { screen: 'Fixed' }) };
      default:
        return null;
    }
  };

  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const renderNotification = (item: AppNotification, index: number) => {
    const animValue = itemAnims[index] || new Animated.Value(1);

    return (
      <Animated.View
        key={item.id}
        style={{
          opacity: animValue,
          transform: [
            {
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity
          style={[
            styles.notificationItem,
            { backgroundColor: colors.surface, borderColor: colors.border },
            !item.read && [styles.notificationUnread, { backgroundColor: isDark ? 'rgba(22, 33, 62, 0.8)' : colors.backgroundCard, borderColor: isDark ? 'rgba(108, 99, 255, 0.12)' : colors.border }],
          ]}
          activeOpacity={0.7}
          onPress={() => handleNotificationPress(item)}
          onLongPress={() => setNotificationToDelete(item.id)}
        >
          {/* Icon */}
          <View
            style={[
              styles.notificationIcon,
              { backgroundColor: `${item.color}18`, borderColor: `${item.color}30` },
            ]}
          >
            <MaterialIcons name={item.icon as any} size={22} color={item.color} />
          </View>

          {/* Content */}
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text
                style={[
                  styles.notificationTitle,
                  { color: colors.textSecondary },
                  !item.read && [styles.notificationTitleUnread, { color: colors.textPrimary }],
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={[styles.notificationTime, { color: colors.textMuted }]}>
                {formatTimeAgo(item.createdAt)}
              </Text>
            </View>
            <Text style={[styles.notificationMessage, { color: colors.textMuted }]} numberOfLines={2}>
              {item.message}
            </Text>
          </View>

          {/* Unread dot */}
          {!item.read && (
            <View style={[styles.unreadDot, { backgroundColor: item.color }]} />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.headerActionBtn} onPress={markAllAsRead}>
              <MaterialIcons name="done-all" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity style={styles.headerActionBtn} onPress={handleClearAll}>
              <MaterialIcons name="delete-outline" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <MaterialIcons name="notifications-off" size={48} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>All caught up!</Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                You'll get alerts about budget limits, bill reminders, and project spending here.
              </Text>
            </View>
          ) : (
            groups.map((group) => (
              <View key={group.title} style={styles.group}>
                <Text style={[styles.groupTitle, { color: colors.textMuted }]}>{group.title}</Text>
                {group.data.map((item, index) => renderNotification(item, index))}
              </View>
            ))
          )}

          {/* Info card */}
          {notifications.length > 0 && (
            <View style={styles.infoCard}>
              <MaterialIcons name="info-outline" size={16} color={colors.textMuted} />
              <Text style={[styles.infoText, { color: colors.textMuted }]}>
                Tap to view details. Long press to delete.
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>

      {/* Clear All Confirmation */}
      <Modal
        visible={showClearConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearConfirm(false)}
      >
        <TouchableOpacity
          style={styles.confirmOverlay}
          activeOpacity={1}
          onPress={() => setShowClearConfirm(false)}
        >
          <View style={[styles.confirmContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>Clear All</Text>
            <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>Remove all notifications?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmCancelBtn, { backgroundColor: colors.background }]}
                onPress={() => setShowClearConfirm(false)}
              >
                <Text style={[styles.confirmCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={() => {
                  clearAll();
                  setShowClearConfirm(false);
                }}
              >
                <Text style={styles.confirmDeleteText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Single Notification Confirmation */}
      <Modal
        visible={notificationToDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationToDelete(null)}
      >
        <TouchableOpacity
          style={styles.confirmOverlay}
          activeOpacity={1}
          onPress={() => setNotificationToDelete(null)}
        >
          <View style={[styles.confirmContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>Delete</Text>
            <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>Remove this notification?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmCancelBtn, { backgroundColor: colors.background }]}
                onPress={() => setNotificationToDelete(null)}
              >
                <Text style={[styles.confirmCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={() => {
                  if (notificationToDelete) {
                    deleteNotification(notificationToDelete);
                    setNotificationToDelete(null);
                  }
                }}
              >
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Notification Detail Modal */}
      <Modal
        visible={selectedNotification !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNotification(null)}
      >
        <TouchableOpacity
          style={styles.confirmOverlay}
          activeOpacity={1}
          onPress={() => setSelectedNotification(null)}
        >
          <View style={[styles.detailContainer, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
            {selectedNotification && (
              <>
                <View style={styles.detailHeader}>
                  <View
                    style={[
                      styles.detailIcon,
                      { backgroundColor: `${selectedNotification.color}18`, borderColor: `${selectedNotification.color}30` },
                    ]}
                  >
                    <MaterialIcons name={selectedNotification.icon as any} size={24} color={selectedNotification.color} />
                  </View>
                  <TouchableOpacity
                    style={[styles.detailCloseBtn, { backgroundColor: colors.background }]}
                    onPress={() => setSelectedNotification(null)}
                  >
                    <MaterialIcons name="close" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>{selectedNotification.title}</Text>
                <Text style={[styles.detailTime, { color: colors.textMuted }]}>{formatTimeAgo(selectedNotification.createdAt)}</Text>
                <Text style={[styles.detailMessage, { color: colors.textSecondary }]}>{selectedNotification.message}</Text>
                {(() => {
                  const target = getNavigationTarget(selectedNotification);
                  if (!target) return null;
                  return (
                    <TouchableOpacity
                      style={styles.detailActionBtn}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedNotification(null);
                        target.action();
                      }}
                    >
                      <MaterialIcons name="arrow-forward" size={18} color="#FFF" />
                      <Text style={styles.detailActionText}>{target.label}</Text>
                    </TouchableOpacity>
                  );
                })()}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(108, 99, 255, 0.08)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  headerBadge: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: '#FFF',
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },

  // Groups
  group: {
    marginBottom: SPACING.lg,
  },
  groupTitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },

  // Notification Item
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 33, 62, 0.5)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.06)',
    gap: SPACING.md,
  },
  notificationUnread: {
    backgroundColor: 'rgba(22, 33, 62, 0.8)',
    borderColor: 'rgba(108, 99, 255, 0.12)',
  },
  notificationIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
    flex: 1,
    marginRight: SPACING.sm,
  },
  notificationTitleUnread: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  notificationTime: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  notificationMessage: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 22,
  },

  // Info
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    justifyContent: 'center',
  },
  infoText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Confirmation Modal
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '80%',
    maxWidth: 340,
  },
  confirmTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  confirmMessage: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
  },
  confirmCancelBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  confirmCancelText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  confirmDeleteBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 61, 113, 0.12)',
  },
  confirmDeleteText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.danger,
  },

  // Detail Modal
  detailContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '85%',
    maxWidth: 380,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  detailIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  detailCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  detailTime: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: SPACING.md,
  },
  detailMessage: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
    lineHeight: 22,
  },
  detailActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    marginTop: SPACING.lg,
    gap: 6,
  },
  detailActionText: {
    fontSize: FONT_SIZE.md,
    color: '#FFF',
    fontWeight: '700',
  },
});
