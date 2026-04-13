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
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GlassCard } from '../components/GlassCard';
import { CategoryIcon } from '../components/CategoryIcon';
import { useExpenseStore } from '../store/useExpenseStore';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOWS,
} from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils/currency';

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const ProjectDetailScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const budgetId = route.params?.budgetId || route.params?.projectId;

  const {
    budgets,
    getBudgetExpenses,
    getBudgetTotal,
    getBudgetPendingTotal,
    deleteExpense,
    markExpenseCompleted,
    updateBudget,
  } = useExpenseStore();

  const budget = budgets.find((p) => p.id === budgetId);
  const expenses = getBudgetExpenses(budgetId);
  const totalSpent = getBudgetTotal(budgetId);
  const totalPending = getBudgetPendingTotal(budgetId);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(heroScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!budget) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyTitle}>Budget not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: COLORS.primary, marginTop: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasBudget = budget.budget && budget.budget > 0;
  const progress = hasBudget ? totalSpent / budget.budget! : 0;
  const isOverBudget = progress > 1;
  const remaining = hasBudget ? budget.budget! - totalSpent : 0;

  // Category breakdown within this budget
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    if (!e.isPending) {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    }
  });
  const sortedCategories = Object.entries(categoryTotals).sort(
    ([, a], [, b]) => b - a
  );

  const handleDeleteExpense = (id: string) => {
    setExpenseToDelete(id);
    setShowDeleteConfirm(true);
  };

  const pendingExpenses = expenses.filter((e) => e.isPending);
  const completedExpenses = expenses.filter((e) => !e.isPending);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {budget.name}
        </Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() =>
            updateBudget(budget.id, {
              status: budget.status === 'active' ? 'completed' : 'active',
            })
          }
        >
          <MaterialIcons
            name={budget.status === 'active' ? 'check-circle-outline' : 'replay'}
            size={24}
            color={budget.status === 'active' ? COLORS.success : COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Card */}
        <Animated.View
          style={{
            transform: [{ scale: heroScale }],
            opacity: fadeAnim,
          }}
        >
          <View style={styles.heroCard}>
            <LinearGradient
              colors={[budget.color, `${budget.color}88`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              {/* Decorative elements */}
              <View style={[styles.heroCircle, styles.heroCircle1]} />
              <View style={[styles.heroCircle, styles.heroCircle2]} />

              <View style={styles.heroContent}>
                <Text style={styles.heroLabel}>Committed</Text>
                <Text style={styles.heroAmount}>{formatCurrency(totalSpent)}</Text>

                {totalPending > 0 && (
                  <View style={styles.heroPendingRow}>
                    <MaterialIcons name="schedule" size={14} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.heroPendingText}>
                      {formatCurrency(totalPending)} pending
                    </Text>
                  </View>
                )}

                {hasBudget && (
                  <>
                    <View style={styles.heroBudgetBar}>
                      <View
                        style={[
                          styles.heroBudgetFill,
                          {
                            width: `${Math.min(progress * 100, 100)}%`,
                            backgroundColor: isOverBudget
                              ? 'rgba(255, 61, 113, 0.8)'
                              : 'rgba(255, 255, 255, 0.5)',
                          },
                        ]}
                      />
                      {totalPending > 0 && (
                        <View
                          style={[
                            styles.heroBudgetPending,
                            {
                              width: `${Math.min((totalPending / budget.budget!) * 100, 100 - Math.min(progress * 100, 100))}%`,
                            },
                          ]}
                        />
                      )}
                    </View>
                    <View style={styles.heroBudgetInfo}>
                      <Text style={styles.heroBudgetText}>
                        {isOverBudget
                          ? `Over budget by ${formatCurrency(Math.abs(remaining))}`
                          : `${formatCurrency(remaining)} remaining`}
                      </Text>
                      <Text style={styles.heroBudgetText}>
                        of {formatCurrency(budget.budget!)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
          <GlassCard style={styles.statCard} intensity="low">
            <Text style={styles.statValue}>{expenses.length}</Text>
            <Text style={styles.statLabel}>Expenses</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} intensity="low">
            <Text style={styles.statValue}>{sortedCategories.length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} intensity="low">
            <Text style={styles.statValue}>
              {completedExpenses.length > 0
                ? formatCurrency(totalSpent / completedExpenses.length)
                : '$0'}
            </Text>
            <Text style={styles.statLabel}>Average</Text>
          </GlassCard>
        </Animated.View>

        {/* Category Breakdown */}
        {sortedCategories.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <GlassCard style={styles.categoriesCard} intensity="low">
              <Text style={styles.sectionTitle}>Spending Breakdown</Text>
              {sortedCategories.map(([category, amount]) => {
                const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
                return (
                  <View key={category} style={styles.categoryRow}>
                    <CategoryIcon category={category} size={36} />
                    <View style={styles.categoryInfo}>
                      <View style={styles.categoryHeader}>
                        <Text style={styles.categoryName}>{category}</Text>
                        <Text style={styles.categoryAmount}>
                          {formatCurrency(amount)}
                        </Text>
                      </View>
                      <View style={styles.categoryBarBg}>
                        <View
                          style={[
                            styles.categoryBarFill,
                            {
                              width: `${percentage}%`,
                              backgroundColor: budget.color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.categoryPercent}>
                      {Math.round(percentage)}%
                    </Text>
                  </View>
                );
              })}
            </GlassCard>
          </Animated.View>
        )}

        {/* Pending Expenses */}
        {pendingExpenses.length > 0 && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.expenseHeader}>
              <Text style={styles.sectionTitle}>Pending Expenses</Text>
              <View style={styles.pendingBadge}>
                <MaterialIcons name="schedule" size={14} color={COLORS.warning} />
                <Text style={styles.pendingBadgeText}>{pendingExpenses.length}</Text>
              </View>
            </View>

            {pendingExpenses.map((expense) => (
              <View key={expense.id} style={styles.pendingExpenseItem}>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.md }}
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate('AddExpense', {
                      expense,
                      projectId: budget.id,
                    })
                  }
                  onLongPress={() => handleDeleteExpense(expense.id)}
                >
                  <CategoryIcon category={expense.category} size={42} />
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseDesc}>
                      {expense.description || expense.category}
                    </Text>
                    <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
                  </View>
                  <Text style={[styles.expenseAmount, { color: COLORS.warning }]}>
                    {formatCurrency(expense.amount)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.completeBtn}
                  onPress={() => markExpenseCompleted(expense.id)}
                >
                  <MaterialIcons name="check-circle-outline" size={22} color={COLORS.success} />
                </TouchableOpacity>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Committed Expenses List */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.expenseHeader}>
            <Text style={styles.sectionTitle}>
              {pendingExpenses.length > 0 ? 'Committed Expenses' : 'All Expenses'}
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('AddExpense', { projectId: budget.id })
              }
            >
              <LinearGradient
                colors={[budget.color, `${budget.color}CC`]}
                style={styles.addExpenseBtnGradient}
              >
                <MaterialIcons name="add" size={16} color="#FFF" />
                <Text style={styles.addExpenseText}>Add</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {completedExpenses.length === 0 && pendingExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt-long" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptySubtext}>
                No expenses yet. Tap "Add" to link an expense to this budget.
              </Text>
            </View>
          ) : completedExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptySubtext}>
                No committed expenses yet. Complete pending expenses above to deduct them from the budget.
              </Text>
            </View>
          ) : (
            completedExpenses.map((expense) => (
              <TouchableOpacity
                key={expense.id}
                style={styles.expenseItem}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('AddExpense', {
                    expense,
                    projectId: budget.id,
                  })
                }
                onLongPress={() => handleDeleteExpense(expense.id)}
              >
                <CategoryIcon category={expense.category} size={42} />
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseDesc}>
                    {expense.description || expense.category}
                  </Text>
                  <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
                </View>
                <Text style={styles.expenseAmount}>
                  {formatCurrency(expense.amount)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </Animated.View>

        {/* Description */}
        {budget.description ? (
          <Animated.View style={{ opacity: fadeAnim }}>
            <GlassCard style={styles.descCard} intensity="low">
              <Text style={styles.descLabel}>About this budget</Text>
              <Text style={styles.descText}>{budget.description}</Text>
              <Text style={styles.descDate}>
                Created {formatDate(budget.createdAt)}
              </Text>
            </GlassCard>
          </Animated.View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('AddExpense', { projectId: budget.id })
        }
      >
        <LinearGradient
          colors={[budget.color, `${budget.color}CC`]}
          style={styles.fabGradient}
        >
          <MaterialIcons name="add" size={28} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <TouchableOpacity
          style={styles.deleteConfirmOverlay}
          activeOpacity={1}
          onPress={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.deleteConfirmContainer}>
            <Text style={styles.deleteConfirmTitle}>Remove Expense</Text>
            <Text style={styles.deleteConfirmMessage}>Remove this expense from the budget?</Text>
            <View style={styles.deleteConfirmButtons}>
              <TouchableOpacity
                style={styles.deleteConfirmCancelBtn}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.deleteConfirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmDeleteBtn}
                onPress={() => {
                  if (expenseToDelete) {
                    deleteExpense(expenseToDelete);
                    setShowDeleteConfirm(false);
                    setExpenseToDelete(null);
                  }
                }}
              >
                <Text style={styles.deleteConfirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
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
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },

  // Hero Card
  heroCard: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.glow,
  },
  heroGradient: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    overflow: 'hidden',
    minHeight: 170,
  },
  heroCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroCircle1: {
    width: 180,
    height: 180,
    top: -50,
    right: -30,
  },
  heroCircle2: {
    width: 100,
    height: 100,
    bottom: -20,
    left: -10,
  },
  heroContent: {
    zIndex: 1,
  },
  heroLabel: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  heroAmount: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: SPACING.sm,
  },
  heroPendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
  },
  heroPendingText: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  heroBudgetBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    flexDirection: 'row',
  },
  heroBudgetFill: {
    height: '100%',
    borderRadius: 3,
  },
  heroBudgetPending: {
    height: '100%',
    backgroundColor: 'rgba(255, 170, 0, 0.4)',
  },
  heroBudgetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroBudgetText: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: SPACING.md,
  },
  statValue: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Categories
  categoriesCard: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: SPACING.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  categoryAmount: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  categoryBarBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryPercent: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
  },

  // Expenses
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  addExpenseBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
  },
  addExpenseText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: '#FFF',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(255, 170, 0, 0.1)',
  },
  pendingBadgeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.warning,
    fontWeight: '700',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 33, 62, 0.6)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.06)',
    gap: SPACING.md,
  },
  pendingExpenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 33, 62, 0.6)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 170, 0, 0.2)',
    borderStyle: 'dashed',
    gap: SPACING.sm,
  },
  completeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 214, 143, 0.1)',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDesc: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  expenseAmount: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },

  // Description
  descCard: {
    marginTop: SPACING.lg,
  },
  descLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  descText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  descDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 240,
    marginTop: SPACING.md,
    lineHeight: 22,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 32,
    right: SPACING.lg,
    borderRadius: 29,
  },
  fabGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Delete Confirmation Modal
  deleteConfirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteConfirmContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '80%',
    maxWidth: 340,
  },
  deleteConfirmTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  deleteConfirmMessage: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
  },
  deleteConfirmCancelBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  deleteConfirmCancelText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  deleteConfirmDeleteBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 61, 113, 0.12)',
  },
  deleteConfirmDeleteText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.danger,
  },
});
