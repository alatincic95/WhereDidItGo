import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../components/GlassCard';
import { useExpenseStore } from '../store/useExpenseStore';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOWS,
} from '../constants/theme';
import { BUDGET_COLORS, Budget, BudgetTemplate } from '../types';
import { formatCurrency } from '../utils/currency';

export const ProjectsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    budgets,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetTotal,
    getBudgetPendingTotal,
    budgetTemplates,
    addBudgetTemplate,
    deleteBudgetTemplate,
    createBudgetFromTemplate,
  } = useExpenseStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedColor, setSelectedColor] = useState(BUDGET_COLORS[0]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDeleteTemplate, setShowDeleteTemplate] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<BudgetTemplate | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const activeBudgets = budgets.filter((p) => p.status === 'active');
  const completedBudgets = budgets.filter((p) => p.status === 'completed');
  const totalAcrossBudgets = budgets
    .filter((p) => p.status === 'active')
    .reduce((sum, p) => sum + getBudgetTotal(p.id), 0);

  const openModal = (b?: Budget) => {
    if (b) {
      setEditingBudget(b);
      setName(b.name);
      setDescription(b.description);
      setBudget(b.budget?.toString() || '');
      setSelectedColor(b.color);
    } else {
      setEditingBudget(null);
      setName('');
      setDescription('');
      setBudget('');
      setSelectedColor(BUDGET_COLORS[0]);
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      description: description.trim(),
      budget: budget ? parseFloat(budget) : undefined,
      color: selectedColor,
      status: editingBudget?.status || ('active' as const),
    };

    if (editingBudget) {
      updateBudget(editingBudget.id, data);
    } else {
      addBudget(data);
    }
    setModalVisible(false);
  };

  const handleDelete = (b: Budget) => {
    setBudgetToDelete(b);
    setShowDeleteConfirm(true);
  };

  const handleToggleStatus = (b: Budget) => {
    const newStatus = b.status === 'active' ? 'completed' : 'active';
    updateBudget(b.id, { status: newStatus });
  };

  const renderBudgetCard = (b: Budget) => {
    const spent = getBudgetTotal(b.id);
    const pending = getBudgetPendingTotal(b.id);
    const hasBudget = b.budget && b.budget > 0;
    const progress = hasBudget ? spent / b.budget! : 0;
    const isOverBudget = progress > 1;
    const isCompleted = b.status === 'completed';

    return (
      <TouchableOpacity
        key={b.id}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('BudgetDetail', { budgetId: b.id })}
        onLongPress={() => handleDelete(b)}
      >
        <View style={[styles.budgetCard, isCompleted && styles.budgetCardCompleted]}>
          {/* Color accent bar */}
          <View style={[styles.budgetAccent, { backgroundColor: b.color }]} />

          <View style={styles.budgetContent}>
            <View style={styles.budgetHeader}>
              <View style={styles.budgetTitleRow}>
                <View
                  style={[styles.budgetDot, { backgroundColor: b.color }]}
                />
                <Text style={styles.budgetName} numberOfLines={1}>
                  {b.name}
                </Text>
              </View>
              <View style={styles.budgetActions}>
                {isCompleted && (
                  <View style={styles.completedBadge}>
                    <MaterialIcons name="check-circle" size={14} color={COLORS.success} />
                    <Text style={styles.completedText}>Done</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.budgetActionBtn}
                  onPress={() => handleToggleStatus(b)}
                >
                  <MaterialIcons
                    name={isCompleted ? 'replay' : 'check'}
                    size={18}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.budgetActionBtn}
                  onPress={() => openModal(b)}
                >
                  <MaterialIcons name="edit" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {b.description ? (
              <Text style={styles.budgetDesc} numberOfLines={1}>
                {b.description}
              </Text>
            ) : null}

            <View style={styles.budgetStats}>
              <View>
                <Text style={styles.budgetStatLabel}>Spent</Text>
                <Text
                  style={[
                    styles.budgetStatValue,
                    { color: isOverBudget ? COLORS.danger : b.color },
                  ]}
                >
                  {formatCurrency(spent)}
                </Text>
              </View>
              {pending > 0 && (
                <View>
                  <Text style={styles.budgetStatLabel}>Pending</Text>
                  <Text style={[styles.budgetStatValue, { color: COLORS.warning }]}>
                    {formatCurrency(pending)}
                  </Text>
                </View>
              )}
              {hasBudget && (
                <View style={styles.budgetStatRight}>
                  <Text style={styles.budgetStatLabel}>Budget</Text>
                  <Text style={styles.budgetStatValue}>
                    {formatCurrency(b.budget!)}
                  </Text>
                </View>
              )}
            </View>

            {hasBudget && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={
                      isOverBudget
                        ? ['#FF3D71', '#FF6B8A']
                        : progress > 0.75
                        ? ['#FFAA00', '#FFBB33']
                        : [b.color, `${b.color}CC`]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(progress * 100, 100)}%` },
                    ]}
                  />
                  {pending > 0 && hasBudget && (
                    <View
                      style={[
                        styles.progressPending,
                        {
                          width: `${Math.min((pending / b.budget!) * 100, 100 - Math.min(progress * 100, 100))}%`,
                          backgroundColor: `${COLORS.warning}40`,
                        },
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.progressText,
                    isOverBudget && { color: COLORS.danger },
                  ]}
                >
                  {Math.round(progress * 100)}%
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Budgets</Text>
        <View style={styles.headerActions}>
          {budgetTemplates.length > 0 && (
            <TouchableOpacity
              style={styles.templateBtn}
              onPress={() => setShowTemplates(true)}
            >
              <MaterialIcons name="bookmark" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
            <LinearGradient
              colors={['#6C63FF', '#BB8FCE']}
              style={styles.addBtnGradient}
            >
              <MaterialIcons name="add" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Card */}
        <GlassCard style={styles.summaryCard} glowColor="#6C63FF" intensity="medium">
          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <MaterialIcons name="account-balance-wallet" size={26} color="#6C63FF" />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Active Budgets</Text>
              <Text style={styles.summaryCount}>{activeBudgets.length}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Total Spent</Text>
              <Text style={[styles.summaryCount, { color: COLORS.accent }]}>
                {formatCurrency(totalAcrossBudgets)}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Active Budgets */}
        {activeBudgets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active</Text>
            {activeBudgets.map(renderBudgetCard)}
          </View>
        )}

        {/* Completed Budgets */}
        {completedBudgets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed</Text>
            {completedBudgets.map(renderBudgetCard)}
          </View>
        )}

        {budgets.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="account-balance-wallet" size={48} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No budgets yet</Text>
            <Text style={styles.emptySubtext}>
              Create a budget to track spending on specific goals like a trip, wedding, or renovation.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => openModal()}
            >
              <LinearGradient
                colors={['#6C63FF', '#BB8FCE']}
                style={styles.emptyBtnGradient}
              >
                <MaterialIcons name="add" size={18} color="#FFF" />
                <Text style={styles.emptyBtnText}>Create Budget</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingBudget ? 'Edit Budget' : 'New Budget'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Name */}
            <Text style={styles.modalLabel}>Budget Name</Text>
            <TextInput
              style={styles.modalInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Summer Trip, New Kitchen"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
            />

            {/* Description */}
            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputMultiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="What is this budget for?"
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
            />

            {/* Budget */}
            <Text style={styles.modalLabel}>Spending Limit (optional)</Text>
            <View style={styles.modalBudgetRow}>
              <Text style={styles.modalCurrency}>$</Text>
              <TextInput
                style={styles.modalBudgetInput}
                value={budget}
                onChangeText={setBudget}
                placeholder="0.00"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Color */}
            <Text style={styles.modalLabel}>Color</Text>
            <View style={styles.colorGrid}>
              {BUDGET_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorItem,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorItemSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <MaterialIcons name="check" size={18} color="#FFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Save as Template */}
            {!editingBudget && name.trim() !== '' && (
              <TouchableOpacity
                style={styles.saveTemplateBtn}
                onPress={() => {
                  if (!name.trim()) return;
                  addBudgetTemplate({
                    name: name.trim(),
                    description: description.trim(),
                    budget: budget ? parseFloat(budget) : undefined,
                    color: selectedColor,
                    icon: 'bookmark',
                  });
                  handleSave();
                }}
              >
                <MaterialIcons name="bookmark-add" size={20} color={COLORS.primary} />
                <Text style={styles.saveTemplateBtnText}>Save & Create as Template</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Modal>

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
            <Text style={styles.deleteConfirmTitle}>Delete Budget</Text>
            <Text style={styles.deleteConfirmMessage}>
              Delete "{budgetToDelete?.name}"? Expenses linked to it will be unlinked but not deleted.
            </Text>
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
                  if (budgetToDelete) {
                    deleteBudget(budgetToDelete.id);
                    setShowDeleteConfirm(false);
                    setBudgetToDelete(null);
                  }
                }}
              >
                <Text style={styles.deleteConfirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Templates Modal */}
      <Modal
        visible={showTemplates}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTemplates(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTemplates(false)}>
              <Text style={styles.modalCancel}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Budget Templates</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.templateSubtitle}>
              Tap a template to create a budget from it. Long-press to delete.
            </Text>
            {budgetTemplates.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={styles.templateCard}
                activeOpacity={0.7}
                onPress={() => {
                  createBudgetFromTemplate(t.id);
                  setShowTemplates(false);
                }}
                onLongPress={() => {
                  setTemplateToDelete(t);
                  setShowDeleteTemplate(true);
                }}
              >
                <View style={[styles.templateDot, { backgroundColor: t.color }]} />
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{t.name}</Text>
                  {t.description ? (
                    <Text style={styles.templateDesc} numberOfLines={1}>{t.description}</Text>
                  ) : null}
                </View>
                {t.budget ? (
                  <Text style={[styles.templateBudget, { color: t.color }]}>
                    {formatCurrency(t.budget)}
                  </Text>
                ) : null}
                <MaterialIcons name="add-circle-outline" size={22} color={COLORS.textMuted} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            ))}

            {budgetTemplates.length === 0 && (
              <View style={styles.templateEmpty}>
                <MaterialIcons name="bookmark-border" size={40} color={COLORS.textMuted} />
                <Text style={styles.templateEmptyText}>
                  No templates yet. Create a budget and choose "Save & Create as Template".
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Template Confirmation */}
      <Modal
        visible={showDeleteTemplate}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteTemplate(false)}
      >
        <TouchableOpacity
          style={styles.deleteConfirmOverlay}
          activeOpacity={1}
          onPress={() => setShowDeleteTemplate(false)}
        >
          <View style={styles.deleteConfirmContainer}>
            <Text style={styles.deleteConfirmTitle}>Delete Template</Text>
            <Text style={styles.deleteConfirmMessage}>
              Delete template "{templateToDelete?.name}"?
            </Text>
            <View style={styles.deleteConfirmButtons}>
              <TouchableOpacity
                style={styles.deleteConfirmCancelBtn}
                onPress={() => setShowDeleteTemplate(false)}
              >
                <Text style={styles.deleteConfirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmDeleteBtn}
                onPress={() => {
                  if (templateToDelete) {
                    deleteBudgetTemplate(templateToDelete.id);
                    setShowDeleteTemplate(false);
                    setTemplateToDelete(null);
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
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    color: COLORS.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  templateBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  addBtnGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },

  // Summary
  summaryCard: {
    marginBottom: SPACING.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryCount: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },

  // Section
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },

  // Budget Card
  budgetCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(22, 33, 62, 0.7)',
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.08)',
    overflow: 'hidden',
  },
  budgetCardCompleted: {
    opacity: 0.6,
  },
  budgetAccent: {
    width: 4,
  },
  budgetContent: {
    flex: 1,
    padding: SPACING.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  budgetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  budgetDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  budgetName: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
    flex: 1,
  },
  budgetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  budgetActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 214, 143, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
    gap: 4,
    marginRight: 4,
  },
  completedText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
    fontWeight: '600',
  },
  budgetDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  budgetStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  budgetStatRight: {
    alignItems: 'flex-end',
  },
  budgetStatLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  budgetStatValue: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPending: {
    height: '100%',
  },
  progressText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '700',
    width: 40,
    textAlign: 'right',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
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
    maxWidth: 280,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  emptyBtn: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  emptyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  emptyBtnText: {
    fontSize: FONT_SIZE.md,
    color: '#FFF',
    fontWeight: '700',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCancel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  modalSave: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '700',
  },
  modalContent: {
    padding: SPACING.lg,
  },
  modalLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  modalInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalBudgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCurrency: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.primary,
    fontWeight: '700',
    marginRight: SPACING.sm,
  },
  modalBudgetInput: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  colorItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorItemSelected: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
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

  // Save as Template button
  saveTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
  },
  saveTemplateBtnText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Templates
  templateSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: SPACING.lg,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  templateDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.md,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  templateDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  templateBudget: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  templateEmpty: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  templateEmptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 260,
    marginTop: SPACING.md,
    lineHeight: 22,
  },
});
