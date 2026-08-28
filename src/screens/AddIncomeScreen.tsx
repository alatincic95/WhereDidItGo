import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useExpenseStore } from '../store/useExpenseStore';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOWS,
} from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Income,
  INCOME_SOURCES,
  INCOME_SOURCE_ICONS,
  INCOME_SOURCE_COLORS,
  IncomeSource,
  RecurringFrequency,
} from '../types';
import { useUndoStore } from '../store/useUndoStore';
import { hapticSuccess, hapticError, hapticWarning } from '../utils/haptics';
import { CalendarPicker } from '../components/CalendarPicker';

export const AddIncomeScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const editingIncome: Income | undefined = route.params?.income;

  const { addIncome, addIncomeWithId, updateIncome, deleteIncome, convertIncomeToRecurring, currencySymbol } = useExpenseStore();
  const showUndo = useUndoStore((s) => s.show);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertFrequency, setConvertFrequency] = useState<RecurringFrequency>('monthly');

  const performDelete = () => {
    if (!editingIncome) return;
    const snapshot = editingIncome;
    deleteIncome(snapshot.id);
    hapticWarning();
    showUndo({
      message: 'Income deleted',
      entityType: 'income',
      restore: () => addIncomeWithId(snapshot),
    });
    navigation.goBack();
  };

  const handleConvertToRecurring = () => {
    if (!editingIncome) return;
    convertIncomeToRecurring(editingIncome.id, convertFrequency);
    setShowConvertModal(false);
    navigation.goBack();
  };

  const [error, setError] = useState('');
  const [amount, setAmount] = useState(editingIncome?.amount?.toString() || '');
  const [source, setSource] = useState<string>(editingIncome?.source || '');
  const [description, setDescription] = useState(editingIncome?.description || '');
  const [date, setDate] = useState(
    editingIncome?.date ? new Date(editingIncome.date) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const amountScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAmountFocus = () => {
    Animated.spring(amountScale, {
      toValue: 1.05,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleAmountBlur = () => {
    Animated.spring(amountScale, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleSave = () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      hapticError();
      return;
    }
    if (!source) {
      setError('Please select an income source');
      hapticError();
      return;
    }

    const incomeData = {
      amount: parseFloat(amount),
      source: source as IncomeSource,
      description,
      date: date.toISOString(),
    };

    if (editingIncome) {
      const previousState = { ...editingIncome };
      updateIncome(editingIncome.id, incomeData);
      showUndo({
        message: 'Income updated',
        entityType: 'income',
        restore: () => updateIncome(editingIncome.id, previousState),
      });
    } else {
      addIncome(incomeData);
    }

    hapticSuccess();
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {editingIncome ? 'Edit Income' : 'New Income'}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Amount Input */}
          <Animated.View
            style={[
              styles.amountSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: amountScale }],
              },
            ]}
          >
            <Text style={[styles.amountLabel, { color: colors.textMuted }]}>Amount</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>{currencySymbol}</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.textPrimary }]}
                value={amount}
                onChangeText={(val) => { setError(''); setAmount(val); }}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                onFocus={handleAmountFocus}
                onBlur={handleAmountBlur}
              />
            </View>
            <View style={styles.amountLine}>
              <LinearGradient
                colors={['#00D68F', '#45B7D1', '#6C63FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.amountLineGradient}
              />
            </View>
            {error ? <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4, textAlign: 'center' }}>{error}</Text> : null}
          </Animated.View>

          {/* Source Selector */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Source</Text>
            <View style={styles.sourceGrid}>
              {INCOME_SOURCES.map((src) => {
                const isSelected = source === src;
                const color = INCOME_SOURCE_COLORS[src];
                const icon = INCOME_SOURCE_ICONS[src];

                return (
                  <TouchableOpacity
                    key={src}
                    style={[
                      styles.sourceItem,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isSelected && {
                        borderColor: color,
                        backgroundColor: `${color}15`,
                      },
                    ]}
                    onPress={() => setSource(src)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.sourceIconWrap,
                        {
                          backgroundColor: isSelected ? `${color}25` : `${colors.textMuted}10`,
                        },
                      ]}
                    >
                      <MaterialIcons
                        name={icon as any}
                        size={22}
                        color={isSelected ? color : colors.textMuted}
                      />
                    </View>
                    <Text
                      style={[
                        styles.sourceText,
                        { color: colors.textSecondary },
                        isSelected && { color },
                      ]}
                    >
                      {src}
                    </Text>
                    {isSelected && (
                      <View style={[styles.selectedDot, { backgroundColor: color }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* Description */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Description</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="notes" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Where did this income come from?"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={200}
              />
            </View>
          </Animated.View>

          {/* Date */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Date</Text>
            <TouchableOpacity
              style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons name="calendar-today" size={20} color={colors.textMuted} />
              <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                {date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Convert to Recurring (edit mode only) */}
          {editingIncome && (
            <TouchableOpacity
              style={[styles.convertBtn, { borderColor: `${colors.primary}4D`, backgroundColor: `${colors.primary}14` }]}
              activeOpacity={0.8}
              onPress={() => setShowConvertModal(true)}
            >
              <MaterialIcons name="autorenew" size={20} color={colors.primary} />
              <Text style={[styles.convertBtnText, { color: colors.primary }]}>Convert to Recurring</Text>
            </TouchableOpacity>
          )}

          {/* Delete Button (inside scroll) */}
          {editingIncome && (
            <TouchableOpacity
              style={[styles.deleteBtn, { borderColor: `${colors.danger}4D`, backgroundColor: `${colors.danger}14` }]}
              activeOpacity={0.8}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <MaterialIcons name="delete-outline" size={20} color={colors.danger} />
              <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Delete Income</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker */}
      <CalendarPicker
        visible={showDatePicker}
        date={date}
        onSelect={setDate}
        onClose={() => setShowDatePicker(false)}
        showQuickSelect
      />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDeleteConfirm(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Delete Income</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Are you sure you want to delete this income entry? This action can be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: colors.background }]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalDeleteBtn, { backgroundColor: `${colors.danger}18` }]}
                onPress={() => { setShowDeleteConfirm(false); performDelete(); }}
              >
                <Text style={[styles.modalDeleteText, { color: colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Convert to Recurring Modal */}
      <Modal
        visible={showConvertModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConvertModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowConvertModal(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Convert to Recurring</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              This income will be moved to your recurring list and removed from one-time income. Choose how often it repeats.
            </Text>
            <View style={styles.freqRow}>
              {(['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'] as RecurringFrequency[]).map((f) => {
                const labels: Record<RecurringFrequency, string> = { weekly: 'Wk', biweekly: '2Wk', monthly: 'Mo', quarterly: 'Qt', yearly: 'Yr' };
                const isSel = convertFrequency === f;
                return (
                  <TouchableOpacity
                    key={f}
                    style={[styles.freqChip, { backgroundColor: colors.background, borderColor: colors.border }, isSel && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => setConvertFrequency(f)}
                  >
                    <Text style={[styles.freqChipText, { color: colors.textMuted }, isSel && { color: '#FFF' }]}>
                      {labels[f]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: colors.background }]}
                onPress={() => setShowConvertModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalDeleteBtn, { backgroundColor: `${colors.primary}20` }]}
                onPress={handleConvertToRecurring}
              >
                <Text style={[styles.modalDeleteText, { color: colors.primary }]}>Convert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Save Button */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.saveBtn}
          activeOpacity={0.8}
          onPress={handleSave}
        >
          <LinearGradient
            colors={['#00D68F', '#45B7D1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            <MaterialIcons name="check" size={22} color="#FFF" />
            <Text style={styles.saveBtnText}>
              {editingIncome ? 'Update Income' : 'Add Income'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },

  // Amount
  amountSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  amountLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currencySymbol: {
    fontSize: 28,
    color: '#00D68F',
    fontWeight: '700',
    marginTop: 8,
    marginRight: 4,
  },
  amountInput: {
    fontSize: 56,
    color: COLORS.textPrimary,
    fontWeight: '800',
    letterSpacing: -1,
    minWidth: 120,
    textAlign: 'center',
    paddingVertical: 4,
  },
  amountLine: {
    width: 200,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  amountLineGradient: {
    flex: 1,
  },

  // Sources
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  sourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  sourceItem: {
    width: '30.5%',
    aspectRatio: 1.1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    position: 'relative',
  },
  sourceIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  sourceText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  selectedDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Description
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
    paddingVertical: 4,
    minHeight: 24,
  },
  dateText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },

  // Convert to Recurring
  convertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  convertBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },

  // Delete
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  deleteBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '85%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  modalMessage: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
  },
  modalCancelBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  modalCancelText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  modalDeleteBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  modalDeleteText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  freqRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  freqChip: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    alignItems: 'center',
  },
  freqChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    paddingBottom: 36,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(108, 99, 255, 0.08)',
  },
  saveBtn: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md + 2,
    gap: SPACING.sm,
  },
  saveBtnText: {
    fontSize: FONT_SIZE.lg,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
