import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../components/GlassCard';
import { CategoryIcon } from '../components/CategoryIcon';
import { useExpenseStore } from '../store/useExpenseStore';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { CATEGORY_COLORS, ExpenseCategory } from '../types';
import { formatCurrency } from '../utils/currency';

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const CategoryBudgetsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();

  const {
    categoryBudgets,
    setCategoryBudget,
    removeCategoryBudget,
    toggleCategoryBudget,
    getCategoryBudgetStatus,
    getOrderedCategories,
    getCategoryTotals,
    monthlyIncome,
    currencySymbol,
  } = useExpenseStore();

  const currentMonth = getCurrentMonth();
  const orderedCategories = getOrderedCategories();
  const categoryTotals = getCategoryTotals(currentMonth);
  const budgetStatuses = getCategoryBudgetStatus(currentMonth);

  const [editCategory, setEditCategory] = useState<string | null>(null);
  const [limitInput, setLimitInput] = useState('');
  const [deleteConfirmCategory, setDeleteConfirmCategory] = useState<string | null>(null);

  const totalAllocated = useMemo(
    () => categoryBudgets.filter((b) => b.enabled).reduce((sum, b) => sum + b.monthlyLimit, 0),
    [categoryBudgets]
  );

  const openEdit = (category: string) => {
    const existing = categoryBudgets.find((b) => b.category === category);
    setLimitInput(existing ? String(existing.monthlyLimit) : '');
    setEditCategory(category);
  };

  const handleSave = () => {
    if (!editCategory) return;
    const val = parseFloat(limitInput);
    if (!isNaN(val) && val > 0) {
      setCategoryBudget(editCategory, val);
    }
    setEditCategory(null);
  };

  const handleRemove = () => {
    if (!editCategory) return;
    setDeleteConfirmCategory(editCategory);
  };

  const confirmRemove = () => {
    if (deleteConfirmCategory) {
      removeCategoryBudget(deleteConfirmCategory);
    }
    setDeleteConfirmCategory(null);
    setEditCategory(null);
  };

  const getBudgetForCategory = (category: string) =>
    categoryBudgets.find((b) => b.category === category);

  const getStatusForCategory = (category: string) =>
    budgetStatuses.find((s) => s.category === category);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Category Budgets</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <GlassCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>ALLOCATED</Text>
              <Text style={[styles.summaryAmount, { color: colors.textPrimary }]}>
                {formatCurrency(totalAllocated)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>MONTHLY INCOME</Text>
              <Text style={[styles.summaryAmount, { color: colors.textSecondary }]}>
                {formatCurrency(monthlyIncome)}
              </Text>
            </View>
          </View>
          {monthlyIncome > 0 && (
            <View style={styles.allocationBar}>
              <View
                style={[
                  styles.allocationBarFill,
                  {
                    width: `${Math.min((totalAllocated / monthlyIncome) * 100, 100)}%`,
                    backgroundColor: totalAllocated > monthlyIncome ? colors.danger : colors.primary,
                  },
                ]}
              />
            </View>
          )}
        </GlassCard>

        {/* Category List */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>CATEGORIES</Text>
        {orderedCategories.map((category) => {
          const budget = getBudgetForCategory(category);
          const status = getStatusForCategory(category);
          const spent = status?.spent ?? categoryTotals[category] ?? 0;
          const color =
            CATEGORY_COLORS[category as ExpenseCategory] ||
            useExpenseStore.getState().customCategories.find((c) => c.name === category)?.color ||
            '#AEB6BF';

          return (
            <TouchableOpacity key={category} activeOpacity={0.7} onPress={() => openEdit(category)}>
              <GlassCard style={styles.categoryCard}>
                <View style={styles.categoryRow}>
                  <CategoryIcon category={category} size={42} />
                  <View style={styles.categoryInfo}>
                    <View style={styles.categoryHeader}>
                      <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{category}</Text>
                      {budget && (
                        <Switch
                          value={budget.enabled}
                          onValueChange={() => toggleCategoryBudget(category)}
                          trackColor={{ false: colors.border, true: colors.primary }}
                          thumbColor="#FFF"
                          style={{ transform: [{ scale: 0.8 }] }}
                        />
                      )}
                    </View>
                    {budget ? (
                      <>
                        <View style={styles.budgetMeta}>
                          <Text style={[styles.budgetSpent, { color: colors.textSecondary }]}>
                            {formatCurrency(spent)}
                          </Text>
                          <Text style={[styles.budgetSeparator, { color: colors.textMuted }]}> / </Text>
                          <Text style={[styles.budgetLimit, { color: colors.textMuted }]}>
                            {formatCurrency(budget.monthlyLimit)}
                          </Text>
                        </View>
                        {budget.enabled && (
                          <View style={styles.progressBar}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${Math.min((status?.percentage ?? 0) * 100, 100)}%`,
                                  backgroundColor:
                                    (status?.percentage ?? 0) >= 1
                                      ? colors.danger
                                      : (status?.percentage ?? 0) >= 0.8
                                      ? colors.warning
                                      : color,
                                },
                              ]}
                            />
                          </View>
                        )}
                      </>
                    ) : (
                      <Text style={[styles.noLimit, { color: colors.textMuted }]}>
                        Tap to set limit
                      </Text>
                    )}
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editCategory !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditCategory(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditCategory(null)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
            onStartShouldSetResponder={() => true}
          >
            {editCategory && (
              <>
                <View style={styles.modalHeader}>
                  <CategoryIcon category={editCategory} size={48} />
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{editCategory}</Text>
                </View>

                <Text style={[styles.modalLabel, { color: colors.textMuted }]}>
                  Monthly spending limit
                </Text>
                <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.inputCurrency, { color: colors.primary }]}>{currencySymbol}</Text>
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    value={limitInput}
                    onChangeText={setLimitInput}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    autoFocus
                    selectTextOnFocus
                  />
                </View>

                {(() => {
                  const status = getStatusForCategory(editCategory);
                  const spent = status?.spent ?? categoryTotals[editCategory] ?? 0;
                  return (
                    <Text style={[styles.modalHint, { color: colors.textMuted }]}>
                      Current month spending: {formatCurrency(spent)}
                    </Text>
                  );
                })()}

                <View style={styles.modalActions}>
                  {getBudgetForCategory(editCategory) && (
                    <TouchableOpacity style={[styles.removeBtn, { borderColor: colors.danger }]} onPress={handleRemove}>
                      <Text style={[styles.removeBtnText, { color: colors.danger }]}>Remove</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <LinearGradient colors={['#6C63FF', '#9B59B6']} style={styles.saveBtnGradient}>
                      <Text style={styles.saveBtnText}>Save</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmCategory !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmCategory(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDeleteConfirmCategory(null)}
        >
          <View
            style={[styles.confirmModal, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
            onStartShouldSetResponder={() => true}
          >
            <MaterialIcons name="delete-outline" size={36} color={colors.danger} />
            <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>Remove Budget?</Text>
            <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
              Remove the monthly limit for {deleteConfirmCategory}? This won't affect your expenses.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmCancelBtn, { borderColor: colors.border }]}
                onPress={() => setDeleteConfirmCategory(null)}
              >
                <Text style={[styles.confirmCancelText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDeleteBtn} onPress={confirmRemove}>
                <LinearGradient colors={['#FF3D71', '#FF6B8A']} style={styles.confirmDeleteGradient}>
                  <Text style={styles.confirmDeleteText}>Remove</Text>
                </LinearGradient>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },

  // Summary
  summaryCard: {
    marginBottom: SPACING.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },
  summaryLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  allocationBar: {
    height: 6,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  allocationBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Section
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },

  // Category Card
  categoryCard: {
    marginBottom: SPACING.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  budgetMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  budgetSpent: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  budgetSeparator: {
    fontSize: FONT_SIZE.sm,
  },
  budgetLimit: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  noLimit: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Edit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  modalLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  inputCurrency: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
  },
  modalHint: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    marginBottom: SPACING.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  removeBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  removeBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  saveBtnText: {
    fontSize: FONT_SIZE.md,
    color: '#FFF',
    fontWeight: '700',
  },

  // Delete Confirmation
  confirmModal: {
    width: '80%',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  confirmTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  confirmMessage: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  confirmDeleteBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  confirmDeleteGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  confirmDeleteText: {
    fontSize: FONT_SIZE.md,
    color: '#FFF',
    fontWeight: '700',
  },
});
