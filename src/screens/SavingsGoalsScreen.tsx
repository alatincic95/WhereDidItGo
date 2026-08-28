import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { useExpenseStore } from '../store/useExpenseStore';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { BUDGET_COLORS, SavingsGoal } from '../types';
import { formatCurrency } from '../utils/currency';
import { useUndoStore } from '../store/useUndoStore';
import { hapticSuccess, hapticError, hapticWarning } from '../utils/haptics';
import { CalendarPicker } from '../components/CalendarPicker';

const GOAL_ICONS = [
  'savings', 'flight', 'home', 'directions-car', 'school',
  'laptop', 'phone-iphone', 'favorite', 'beach-access', 'shopping-bag',
  'restaurant', 'fitness-center', 'child-care', 'pets', 'diamond',
  'emoji-events', 'celebration', 'card-giftcard', 'medical-services', 'build',
];

export const SavingsGoalsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const {
    savingsGoals,
    addSavingsGoal,
    addSavingsGoalWithId,
    updateSavingsGoal,
    deleteSavingsGoal,
    addToSavingsGoal,
    getOverallBalance,
    currencySymbol,
  } = useExpenseStore();
  const showUndo = useUndoStore((s) => s.show);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [autoContribution, setAutoContribution] = useState('');
  const [selectedColor, setSelectedColor] = useState(BUDGET_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(GOAL_ICONS[0]);

  const [addFundsModal, setAddFundsModal] = useState(false);
  const [addFundsGoal, setAddFundsGoal] = useState<SavingsGoal | null>(null);
  const [fundsAmount, setFundsAmount] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const overallBalance = getOverallBalance();
  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);

  const openModal = (goal?: SavingsGoal) => {
    if (goal) {
      setEditingGoal(goal);
      setName(goal.name);
      setTargetAmount(goal.targetAmount.toString());
      setDeadline(goal.deadline || '');
      setAutoContribution(goal.autoContributionMonthly?.toString() || '');
      setSelectedColor(goal.color);
      setSelectedIcon(goal.icon);
    } else {
      setEditingGoal(null);
      setName('');
      setTargetAmount('');
      setDeadline('');
      setAutoContribution('');
      setSelectedColor(BUDGET_COLORS[0]);
      setSelectedIcon(GOAL_ICONS[0]);
    }
    setError('');
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter a goal name');
      hapticError();
      return;
    }
    const target = parseFloat(targetAmount);
    if (!targetAmount || isNaN(target) || target <= 0) {
      setError('Please enter a valid target amount');
      hapticError();
      return;
    }
    const autoMonthly = parseFloat(autoContribution);
    const autoVal = !isNaN(autoMonthly) && autoMonthly > 0 ? autoMonthly : undefined;

    if (editingGoal) {
      updateSavingsGoal(editingGoal.id, {
        name: name.trim(),
        targetAmount: target,
        deadline: deadline || undefined,
        color: selectedColor,
        icon: selectedIcon,
        autoContributionMonthly: autoVal,
      });
    } else {
      addSavingsGoal({
        name: name.trim(),
        targetAmount: target,
        currentAmount: 0,
        deadline: deadline || undefined,
        color: selectedColor,
        icon: selectedIcon,
        autoContributionMonthly: autoVal,
      });
    }
    hapticSuccess();
    setModalVisible(false);
  };

  const handleAddFunds = () => {
    const amount = parseFloat(fundsAmount);
    if (!addFundsGoal || isNaN(amount) || amount <= 0) return;
    addToSavingsGoal(addFundsGoal.id, amount);
    setAddFundsModal(false);
    setFundsAmount('');
    setAddFundsGoal(null);
  };

  const getDaysRemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getMonthlyNeeded = (goal: SavingsGoal) => {
    if (!goal.deadline) return null;
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining <= 0) return 0;
    const days = getDaysRemaining(goal.deadline);
    if (days <= 0) return remaining;
    const months = days / 30;
    return remaining / Math.max(months, 1);
  };

  const renderGoalCard = (goal: SavingsGoal) => {
    const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
    const isComplete = progress >= 1;
    const daysLeft = goal.deadline ? getDaysRemaining(goal.deadline) : null;
    const monthlyNeeded = getMonthlyNeeded(goal);

    return (
      <TouchableOpacity
        key={goal.id}
        activeOpacity={0.7}
        onPress={() => openModal(goal)}
        onLongPress={() => {
          setGoalToDelete(goal);
          setShowDeleteConfirm(true);
        }}
      >
        <View style={[styles.goalCard, { backgroundColor: colors.surface, borderColor: colors.border }, isComplete && [styles.goalCardComplete, { borderColor: 'rgba(0, 214, 143, 0.2)' }]]}>
          <View style={[styles.goalAccent, { backgroundColor: goal.color }]} />
          <View style={styles.goalContent}>
            <View style={styles.goalHeader}>
              <View style={styles.goalTitleRow}>
                <View style={[styles.goalIconWrap, { backgroundColor: `${goal.color}20` }]}>
                  <MaterialIcons name={goal.icon as any} size={22} color={goal.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.goalName, { color: colors.textPrimary }]} numberOfLines={1}>{goal.name}</Text>
                  {daysLeft !== null && (
                    <Text style={[styles.goalDeadline, { color: colors.textMuted }]}>
                      {isComplete ? 'Goal reached!' :
                        daysLeft === 0 ? 'Deadline today' :
                        `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                    </Text>
                  )}
                </View>
              </View>
              {isComplete && (
                <View style={styles.completeBadge}>
                  <MaterialIcons name="check-circle" size={16} color={COLORS.success} />
                </View>
              )}
            </View>

            <View style={styles.goalStats}>
              <View>
                <Text style={[styles.goalStatLabel, { color: colors.textMuted }]}>Saved</Text>
                <Text style={[styles.goalStatValue, { color: goal.color }]}>
                  {formatCurrency(goal.currentAmount)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.goalStatLabel, { color: colors.textMuted }]}>Target</Text>
                <Text style={[styles.goalStatValue, { color: colors.textPrimary }]}>
                  {formatCurrency(goal.targetAmount)}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: isDark ? 'rgba(108, 99, 255, 0.1)' : `${colors.border}` }]}>
                <LinearGradient
                  colors={isComplete ? ['#00D68F', '#33E0A8'] : [goal.color, `${goal.color}CC`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>{Math.round(progress * 100)}%</Text>
            </View>

            {/* Auto-contribution badge */}
            {goal.autoContributionMonthly && goal.autoContributionMonthly > 0 && !isComplete && (
              <View style={[styles.autoBadge, { backgroundColor: `${goal.color}15` }]}>
                <MaterialIcons name="autorenew" size={12} color={goal.color} />
                <Text style={[styles.autoBadgeText, { color: goal.color }]}>
                  Auto: {formatCurrency(goal.autoContributionMonthly)}/mo
                </Text>
              </View>
            )}

            {/* Monthly needed + Add funds */}
            <View style={styles.goalFooter}>
              {monthlyNeeded !== null && !isComplete && (
                <Text style={[styles.monthlyNeeded, { color: colors.textMuted }]}>
                  ~{formatCurrency(monthlyNeeded)}/mo needed
                </Text>
              )}
              {!isComplete && (
                <TouchableOpacity
                  style={[styles.addFundsBtn, { borderColor: goal.color }]}
                  onPress={() => {
                    setAddFundsGoal(goal);
                    setFundsAmount('');
                    setAddFundsModal(true);
                  }}
                >
                  <MaterialIcons name="add" size={16} color={goal.color} />
                  <Text style={[styles.addFundsBtnText, { color: goal.color }]}>Add Funds</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Savings Goals</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openModal()}>
          <LinearGradient colors={['#6C63FF', '#BB8FCE']} style={styles.addBtnGradient}>
            <MaterialIcons name="add" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary */}
        <GlassCard style={styles.summaryCard} glowColor={COLORS.success} intensity="medium">
          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <MaterialIcons name="savings" size={26} color={COLORS.success} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Total Saved</Text>
              <Text style={[styles.summaryCount, { color: colors.success }]}>
                {formatCurrency(totalSaved)}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryInfo}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Total Target</Text>
              <Text style={[styles.summaryCount, { color: colors.textPrimary }]}>{formatCurrency(totalTarget)}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Goals */}
        {savingsGoals.map(renderGoalCard)}

        {savingsGoals.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="savings" size={48} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No savings goals yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
              Create a goal to start saving toward something specific, like a vacation or emergency fund.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => openModal()}>
              <LinearGradient colors={['#6C63FF', '#BB8FCE']} style={styles.emptyBtnGradient}>
                <MaterialIcons name="add" size={18} color="#FFF" />
                <Text style={styles.emptyBtnText}>Create Goal</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Add/Edit Goal Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={[styles.modalCancel, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editingGoal ? 'Edit Goal' : 'New Goal'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Goal Name</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              value={name}
              onChangeText={(v) => { setName(v); setError(''); }}
              placeholder="e.g., Vacation, Emergency Fund"
              placeholderTextColor={colors.textMuted}
              autoFocus
              maxLength={100}
            />

            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Target Amount</Text>
            <View style={[styles.modalAmountRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.modalCurrency, { color: colors.primary }]}>{currencySymbol}</Text>
              <TextInput
                style={[styles.modalAmountInput, { color: colors.textPrimary }]}
                value={targetAmount}
                onChangeText={(v) => { setTargetAmount(v); setError(''); }}
                placeholder="5,000"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
            {error ? <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}

            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Deadline (Optional)</Text>
            <TouchableOpacity
              style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' }]}
              onPress={() => setShowDeadlinePicker(true)}
            >
              <MaterialIcons name="calendar-today" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
              <Text style={{ color: deadline ? colors.textPrimary : colors.textMuted, fontSize: FONT_SIZE.md, flex: 1 }}>
                {deadline
                  ? new Date(deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : 'Tap to pick a date'}
              </Text>
              {deadline !== '' && (
                <TouchableOpacity onPress={() => setDeadline('')}>
                  <MaterialIcons name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            <CalendarPicker
              visible={showDeadlinePicker}
              date={deadline ? new Date(deadline + 'T00:00:00') : new Date()}
              onSelect={(d) => {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                setDeadline(`${yyyy}-${mm}-${dd}`);
              }}
              onClose={() => setShowDeadlinePicker(false)}
              title="Select Deadline"
              minDate={new Date()}
            />

            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Auto-contribution / month (Optional)</Text>
            <View style={[styles.modalAmountRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.modalCurrency, { color: colors.primary }]}>{currencySymbol}</Text>
              <TextInput
                style={[styles.modalAmountInput, { color: colors.textPrimary }]}
                value={autoContribution}
                onChangeText={setAutoContribution}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={{ fontSize: FONT_SIZE.xs, color: colors.textMuted, marginTop: -SPACING.sm, marginBottom: SPACING.md }}>
              Automatically added once per month when you open the app.
            </Text>

            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Icon</Text>
            <View style={styles.iconGrid}>
              {GOAL_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconItem,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    selectedIcon === icon && { borderColor: selectedColor, backgroundColor: `${selectedColor}20` },
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <MaterialIcons
                    name={icon as any}
                    size={22}
                    color={selectedIcon === icon ? selectedColor : colors.textMuted}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Color</Text>
            <View style={styles.colorGrid}>
              {BUDGET_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorItem,
                    { backgroundColor: color },
                    selectedColor === color && [styles.colorItemSelected, { borderColor: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)' }],
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <MaterialIcons name="check" size={18} color="#FFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Funds Modal */}
      <Modal
        visible={addFundsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setAddFundsModal(false)}
      >
        <TouchableOpacity
          style={styles.fundsOverlay}
          activeOpacity={1}
          onPress={() => setAddFundsModal(false)}
        >
          <View style={[styles.fundsContainer, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.fundsTitle, { color: colors.textPrimary }]}>
              Add to "{addFundsGoal?.name}"
            </Text>
            <View style={[styles.fundsInputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.fundsCurrency}>{currencySymbol}</Text>
              <TextInput
                style={[styles.fundsInput, { color: colors.textPrimary }]}
                value={fundsAmount}
                onChangeText={setFundsAmount}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            <View style={styles.fundsActions}>
              <TouchableOpacity
                style={[styles.fundsCancelBtn, { borderColor: colors.border }]}
                onPress={() => setAddFundsModal(false)}
              >
                <Text style={[styles.fundsCancelText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.fundsSaveBtn} onPress={handleAddFunds}>
                <LinearGradient
                  colors={['#00D68F', '#45B7D1']}
                  style={styles.fundsSaveGradient}
                >
                  <Text style={styles.fundsSaveText}>Add</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <TouchableOpacity
          style={styles.fundsOverlay}
          activeOpacity={1}
          onPress={() => setShowDeleteConfirm(false)}
        >
          <View style={[styles.deleteContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.deleteTitle, { color: colors.textPrimary }]}>Delete Goal</Text>
            <Text style={[styles.deleteMessage, { color: colors.textSecondary }]}>
              Delete "{goalToDelete?.name}"? This cannot be undone.
            </Text>
            <View style={styles.deleteButtons}>
              <TouchableOpacity
                style={[styles.deleteCancelBtn, { backgroundColor: colors.background }]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={[styles.deleteCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={() => {
                  if (goalToDelete) {
                    const snapshot = goalToDelete;
                    deleteSavingsGoal(snapshot.id);
                    hapticWarning();
                    showUndo({
                      message: `Goal "${snapshot.name}" deleted`,
                      entityType: 'goal',
                      restore: () => addSavingsGoalWithId(snapshot),
                    });
                    setShowDeleteConfirm(false);
                    setGoalToDelete(null);
                  }
                }}
              >
                <Text style={styles.deleteConfirmText}>Delete</Text>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    color: COLORS.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.5,
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
  summaryCard: { marginBottom: SPACING.lg },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 214, 143, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  summaryInfo: { flex: 1 },
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

  // Goal Card
  goalCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(22, 33, 62, 0.7)',
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.08)',
    overflow: 'hidden',
  },
  goalCardComplete: {
    borderColor: 'rgba(0, 214, 143, 0.2)',
  },
  goalAccent: { width: 4 },
  goalContent: { flex: 1, padding: SPACING.md },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  goalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalName: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  goalDeadline: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  completeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 214, 143, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  goalStatLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  goalStatValue: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '700',
    width: 40,
    textAlign: 'right',
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthlyNeeded: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
    gap: 4,
    marginBottom: SPACING.sm,
  },
  autoBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  addFundsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    gap: 4,
  },
  addFundsBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 60 },
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
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
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
  modalCancel: { fontSize: FONT_SIZE.md, color: COLORS.textMuted, fontWeight: '600' },
  modalTitle: { fontSize: FONT_SIZE.lg, color: COLORS.textPrimary, fontWeight: '700' },
  modalSave: { fontSize: FONT_SIZE.md, color: COLORS.primary, fontWeight: '700' },
  modalContent: { padding: SPACING.lg },
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
    minHeight: 24,
  },
  modalAmountRow: {
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
  modalAmountInput: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '700',
    paddingVertical: 4,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  iconItem: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
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

  // Add Funds Modal
  fundsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fundsContainer: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: '85%',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.large,
  },
  fundsTitle: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '800',
    marginBottom: SPACING.lg,
  },
  fundsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  fundsCurrency: {
    fontSize: 24,
    color: COLORS.success,
    fontWeight: '700',
    marginRight: SPACING.sm,
  },
  fundsInput: {
    flex: 1,
    fontSize: 28,
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  fundsActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  fundsCancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  fundsCancelText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  fundsSaveBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  fundsSaveGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  fundsSaveText: {
    fontSize: FONT_SIZE.md,
    color: '#FFF',
    fontWeight: '700',
  },

  // Delete
  deleteContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '80%',
    maxWidth: 340,
  },
  deleteTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  deleteMessage: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  deleteButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
  },
  deleteCancelBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  deleteCancelText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  deleteConfirmBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 61, 113, 0.12)',
  },
  deleteConfirmText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.danger,
  },
});
