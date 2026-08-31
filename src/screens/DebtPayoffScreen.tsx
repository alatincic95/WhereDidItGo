import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExpenseStore } from '../store/useExpenseStore';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { Debt, DebtType, DEBT_TYPE_LABELS, DEBT_TYPE_ICONS, DEBT_TYPE_COLORS, PayoffStrategy } from '../types';
import { formatCurrency } from '../utils/currency';
import { calculatePayoff, formatPayoffDuration } from '../utils/debtPayoff';
import type { DebtPayoffResult } from '../utils/debtPayoff';
import { useUndoStore } from '../store/useUndoStore';
import { hapticSuccess, hapticWarning } from '../utils/haptics';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DEBT_TYPES: DebtType[] = ['credit_card', 'student_loan', 'car_loan', 'mortgage', 'personal_loan', 'medical', 'other'];

// ── Payoff Timeline Chart ──────────────────────────────────────────

const TimelineChart: React.FC<{
  result: DebtPayoffResult;
  colors: any;
}> = React.memo(({ result, colors }) => {
  if (result.schedule.length === 0) return null;

  const chartWidth = SCREEN_WIDTH - SPACING.lg * 2 - 50;
  const chartHeight = 140;
  const schedule = result.schedule;

  // Sample to ~60 points
  const step = Math.max(1, Math.floor(schedule.length / 60));
  const points: { x: number; y: number }[] = [];
  const maxBalance = schedule[0]?.totalRemaining || 1;

  for (let i = 0; i < schedule.length; i += step) {
    points.push({
      x: (i / (schedule.length - 1)) * chartWidth,
      y: chartHeight - (schedule[i].totalRemaining / maxBalance) * (chartHeight - 16),
    });
  }
  // Ensure last point reaches zero
  points.push({ x: chartWidth, y: chartHeight });

  return (
    <View style={{ height: chartHeight + 30, marginTop: SPACING.sm }}>
      {/* Y-axis labels */}
      <View style={{ position: 'absolute', top: -4, left: 0 }}>
        <Text style={{ fontSize: 9, color: colors.textMuted, fontWeight: '600' }}>
          {formatCurrency(maxBalance)}
        </Text>
      </View>
      <View style={{ position: 'absolute', bottom: 18, left: 0 }}>
        <Text style={{ fontSize: 9, color: colors.textMuted, fontWeight: '600' }}>
          {formatCurrency(0)}
        </Text>
      </View>
      {/* Grid lines */}
      {[0, 0.5, 1].map((pct, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: (1 - pct) * (chartHeight - 16) + 8,
            left: 46,
            width: chartWidth,
            height: 1,
            backgroundColor: `${colors.textMuted}15`,
          }}
        />
      ))}
      {/* Line */}
      <View style={{ position: 'absolute', left: 46, top: 0, width: chartWidth, height: chartHeight }}>
        {points.map((point, i) => {
          if (i === 0) return null;
          const prev = points[i - 1];
          const dx = point.x - prev.x;
          const dy = point.y - prev.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: prev.x,
                top: prev.y,
                width: length,
                height: 2.5,
                backgroundColor: colors.success,
                borderRadius: 1.5,
                transform: [{ rotate: `${angle}deg` }],
                transformOrigin: 'left center',
              }}
            />
          );
        })}
      </View>
      {/* X-axis labels */}
      <View style={{ position: 'absolute', bottom: 0, left: 46, flexDirection: 'row', justifyContent: 'space-between', width: chartWidth }}>
        <Text style={{ fontSize: 9, color: colors.textMuted }}>Now</Text>
        <Text style={{ fontSize: 9, color: colors.textMuted }}>{formatPayoffDuration(result.months)}</Text>
      </View>
    </View>
  );
});

// ── Main Screen ────────────────────────────────────────────────────

export const DebtPayoffScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const {
    debts,
    addDebt,
    addDebtWithId,
    updateDebt,
    deleteDebt,
    debtExtraPayment,
    setDebtExtraPayment,
    debtStrategy,
    setDebtStrategy,
    currencySymbol,
  } = useExpenseStore();
  const showUndo = useUndoStore((s) => s.show);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [selectedType, setSelectedType] = useState<DebtType>('credit_card');
  const [extraInput, setExtraInput] = useState(debtExtraPayment.toString());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);
  const [error, setError] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const totalMinPayments = debts.reduce((s, d) => s + d.minimumPayment, 0);
  const avgRate = debts.length > 0
    ? debts.reduce((s, d) => s + d.interestRate * d.balance, 0) / (totalDebt || 1)
    : 0;

  const payoffResult = useMemo(
    () => calculatePayoff(debts, debtExtraPayment, debtStrategy),
    [debts, debtExtraPayment, debtStrategy],
  );

  const minOnlyResult = useMemo(
    () => calculatePayoff(debts, 0, debtStrategy),
    [debts, debtStrategy],
  );

  const interestSaved = minOnlyResult.totalInterest - payoffResult.totalInterest;
  const monthsSaved = minOnlyResult.months - payoffResult.months;

  const fmtCurrency = useCallback((n: number) => formatCurrency(n), []);

  const openAdd = () => {
    setEditingDebt(null);
    setName('');
    setBalance('');
    setInterestRate('');
    setMinimumPayment('');
    setSelectedType('credit_card');
    setError('');
    setModalVisible(true);
  };

  const openEdit = (debt: Debt) => {
    setEditingDebt(debt);
    setName(debt.name);
    setBalance(debt.balance.toString());
    setInterestRate(debt.interestRate.toString());
    setMinimumPayment(debt.minimumPayment.toString());
    setSelectedType(debt.type);
    setError('');
    setModalVisible(true);
  };

  const handleSave = () => {
    const trimName = name.trim();
    if (!trimName) { setError('Name is required'); return; }
    const bal = parseFloat(balance);
    if (!bal || bal <= 0) { setError('Enter a valid balance'); return; }
    const rate = parseFloat(interestRate);
    if (isNaN(rate) || rate < 0) { setError('Enter a valid interest rate'); return; }
    const minPay = parseFloat(minimumPayment);
    if (!minPay || minPay <= 0) { setError('Enter a valid minimum payment'); return; }

    if (editingDebt) {
      updateDebt(editingDebt.id, {
        name: trimName,
        type: selectedType,
        balance: bal,
        interestRate: rate,
        minimumPayment: minPay,
      });
    } else {
      addDebt({
        name: trimName,
        type: selectedType,
        balance: bal,
        interestRate: rate,
        minimumPayment: minPay,
      });
    }
    hapticSuccess();
    setModalVisible(false);
  };

  const handleDelete = () => {
    if (!debtToDelete) return;
    const deleted = debtToDelete;
    deleteDebt(deleted.id);
    hapticWarning();
    setShowDeleteConfirm(false);
    setDebtToDelete(null);
    setModalVisible(false);
    showUndo({
      message: `Deleted "${deleted.name}"`,
      entityType: 'debt',
      restore: () => addDebtWithId(deleted),
    });
  };

  const handleExtraChange = (text: string) => {
    setExtraInput(text);
    const val = parseFloat(text);
    if (!isNaN(val) && val >= 0) setDebtExtraPayment(val);
    else if (text === '') setDebtExtraPayment(0);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Debt Payoff</Text>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn} accessibilityLabel="Add debt">
          <MaterialIcons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {debts.length === 0 ? (
          <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
            <View style={[styles.emptyIcon, { backgroundColor: `${colors.danger}15` }]}>
              <MaterialIcons name="account-balance" size={48} color={colors.danger} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No debts tracked</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Add your debts to see a payoff plan with{'\n'}snowball or avalanche strategy
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={openAdd}
            >
              <MaterialIcons name="add" size={20} color="#FFF" />
              <Text style={styles.emptyBtnText}>Add First Debt</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Hero Summary */}
            <View style={[styles.heroCard, {
              backgroundColor: isDark ? 'rgba(22, 33, 62, 0.85)' : colors.backgroundCard,
              borderColor: isDark ? `${colors.danger}30` : colors.border,
            }]}>
              <Text style={[styles.heroLabel, { color: colors.textMuted }]}>TOTAL DEBT</Text>
              <Text
                style={[styles.heroAmount, { color: colors.danger }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {fmtCurrency(totalDebt)}
              </Text>
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatLabel, { color: colors.textMuted }]}>Min. Monthly</Text>
                  <Text style={[styles.heroStatValue, { color: colors.textPrimary }]}>
                    {fmtCurrency(totalMinPayments)}
                  </Text>
                </View>
                <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatLabel, { color: colors.textMuted }]}>Avg. APR</Text>
                  <Text style={[styles.heroStatValue, { color: colors.warning }]}>
                    {avgRate.toFixed(1)}%
                  </Text>
                </View>
                <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatLabel, { color: colors.textMuted }]}>Debts</Text>
                  <Text style={[styles.heroStatValue, { color: colors.textPrimary }]}>{debts.length}</Text>
                </View>
              </View>
            </View>

            {/* Strategy Toggle */}
            <View style={[styles.strategyCard, {
              backgroundColor: isDark ? 'rgba(22, 33, 62, 0.85)' : colors.backgroundCard,
              borderColor: isDark ? `${colors.primary}20` : colors.border,
            }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Payoff Strategy</Text>
              <View style={styles.strategyRow}>
                <TouchableOpacity
                  style={[
                    styles.strategyBtn,
                    {
                      backgroundColor: debtStrategy === 'avalanche' ? `${colors.primary}20` : 'transparent',
                      borderColor: debtStrategy === 'avalanche' ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setDebtStrategy('avalanche')}
                >
                  <MaterialIcons
                    name="trending-down"
                    size={18}
                    color={debtStrategy === 'avalanche' ? colors.primary : colors.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.strategyLabel, {
                      color: debtStrategy === 'avalanche' ? colors.primary : colors.textPrimary,
                    }]}>Avalanche</Text>
                    <Text style={[styles.strategyDesc, { color: colors.textMuted }]}>
                      Highest interest first
                    </Text>
                  </View>
                  {debtStrategy === 'avalanche' && (
                    <MaterialIcons name="check-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.strategyBtn,
                    {
                      backgroundColor: debtStrategy === 'snowball' ? `${colors.success}20` : 'transparent',
                      borderColor: debtStrategy === 'snowball' ? colors.success : colors.border,
                    },
                  ]}
                  onPress={() => setDebtStrategy('snowball')}
                >
                  <MaterialIcons
                    name="ac-unit"
                    size={18}
                    color={debtStrategy === 'snowball' ? colors.success : colors.textMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.strategyLabel, {
                      color: debtStrategy === 'snowball' ? colors.success : colors.textPrimary,
                    }]}>Snowball</Text>
                    <Text style={[styles.strategyDesc, { color: colors.textMuted }]}>
                      Lowest balance first
                    </Text>
                  </View>
                  {debtStrategy === 'snowball' && (
                    <MaterialIcons name="check-circle" size={20} color={colors.success} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Extra payment input */}
              <View style={styles.extraRow}>
                <Text style={[styles.extraLabel, { color: colors.textPrimary }]}>Extra Monthly Payment</Text>
                <View style={[styles.extraInputWrap, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: colors.border,
                }]}>
                  <Text style={[styles.extraCurrency, { color: colors.textMuted }]}>{currencySymbol}</Text>
                  <TextInput
                    style={[styles.extraInput, { color: colors.textPrimary }]}
                    value={extraInput}
                    onChangeText={handleExtraChange}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* Payoff Summary */}
            <View style={[styles.payoffCard, {
              backgroundColor: isDark ? 'rgba(22, 33, 62, 0.85)' : colors.backgroundCard,
              borderColor: isDark ? `${colors.success}20` : colors.border,
            }]}>
              <View style={styles.payoffHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Payoff Plan</Text>
                {payoffResult.months > 0 && (
                  <View style={[styles.freeBadge, { backgroundColor: `${colors.success}20` }]}>
                    <MaterialIcons name="celebration" size={14} color={colors.success} />
                    <Text style={[styles.freeBadgeText, { color: colors.success }]}>
                      Debt-free {payoffResult.debtFreeDate}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.payoffStats}>
                <View style={styles.payoffStat}>
                  <Text style={[styles.payoffStatLabel, { color: colors.textMuted }]}>Time to Freedom</Text>
                  <Text style={[styles.payoffStatValue, { color: colors.primary }]}>
                    {formatPayoffDuration(payoffResult.months)}
                  </Text>
                </View>
                <View style={styles.payoffStat}>
                  <Text style={[styles.payoffStatLabel, { color: colors.textMuted }]}>Total Interest</Text>
                  <Text style={[styles.payoffStatValue, { color: colors.danger }]}>
                    {fmtCurrency(payoffResult.totalInterest)}
                  </Text>
                </View>
                <View style={styles.payoffStat}>
                  <Text style={[styles.payoffStatLabel, { color: colors.textMuted }]}>Total Cost</Text>
                  <Text style={[styles.payoffStatValue, { color: colors.textPrimary }]}>
                    {fmtCurrency(payoffResult.totalPaid)}
                  </Text>
                </View>
              </View>

              {debtExtraPayment > 0 && monthsSaved > 0 && (
                <View style={[styles.savingsRow, { backgroundColor: `${colors.success}10` }]}>
                  <MaterialIcons name="flash-on" size={16} color={colors.success} />
                  <Text style={[styles.savingsText, { color: colors.success }]}>
                    Extra {fmtCurrency(debtExtraPayment)}/mo saves {fmtCurrency(interestSaved)} interest and {formatPayoffDuration(monthsSaved)}
                  </Text>
                </View>
              )}

              {/* Timeline Chart */}
              {payoffResult.months > 0 && (
                <TimelineChart result={payoffResult} colors={colors} />
              )}
            </View>

            {/* Debt Order / Per-debt breakdown */}
            <View style={[styles.orderCard, {
              backgroundColor: isDark ? 'rgba(22, 33, 62, 0.85)' : colors.backgroundCard,
              borderColor: isDark ? `${colors.primary}15` : colors.border,
            }]}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Payoff Order ({debtStrategy === 'avalanche' ? 'Highest Rate' : 'Lowest Balance'})
              </Text>
              {payoffResult.perDebtSummary
                .sort((a, b) => a.monthsToPayoff - b.monthsToPayoff)
                .map((item, idx) => {
                  const debt = debts.find((d) => d.id === item.debtId);
                  if (!debt) return null;
                  const typeColor = DEBT_TYPE_COLORS[debt.type];
                  return (
                    <View key={item.debtId} style={[styles.orderItem, idx > 0 && { borderTopWidth: 1, borderTopColor: `${colors.border}60` }]}>
                      <View style={styles.orderLeft}>
                        <View style={[styles.orderNumber, { backgroundColor: `${typeColor}20` }]}>
                          <Text style={[styles.orderNumText, { color: typeColor }]}>{idx + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.orderName, { color: colors.textPrimary }]} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={[styles.orderMeta, { color: colors.textMuted }]}>
                            {debt.interestRate}% APR · {fmtCurrency(debt.minimumPayment)}/mo
                          </Text>
                        </View>
                      </View>
                      <View style={styles.orderRight}>
                        <Text style={[styles.orderBalance, { color: colors.textPrimary }]}>
                          {fmtCurrency(item.originalBalance)}
                        </Text>
                        <Text style={[styles.orderPayoff, { color: colors.success }]}>
                          {formatPayoffDuration(item.monthsToPayoff)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
            </View>

            {/* Debt Cards */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: SPACING.lg, marginBottom: SPACING.sm }]}>
              Your Debts
            </Text>
            {debts.map((debt) => {
              const typeColor = DEBT_TYPE_COLORS[debt.type];
              const pct = totalDebt > 0 ? (debt.balance / totalDebt) * 100 : 0;
              return (
                <TouchableOpacity
                  key={debt.id}
                  activeOpacity={0.7}
                  onPress={() => openEdit(debt)}
                  style={[styles.debtCard, {
                    backgroundColor: isDark ? 'rgba(22, 33, 62, 0.85)' : colors.backgroundCard,
                    borderColor: isDark ? `${typeColor}30` : colors.border,
                  }]}
                >
                  <View style={styles.debtCardRow}>
                    <View style={[styles.debtIcon, { backgroundColor: `${typeColor}18` }]}>
                      <MaterialIcons name={DEBT_TYPE_ICONS[debt.type] as any} size={22} color={typeColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.debtName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {debt.name}
                      </Text>
                      <Text style={[styles.debtMeta, { color: colors.textMuted }]}>
                        {DEBT_TYPE_LABELS[debt.type]} · {debt.interestRate}% APR
                      </Text>
                    </View>
                    <View style={styles.debtRight}>
                      <Text style={[styles.debtBalance, { color: colors.danger }]}>
                        {fmtCurrency(debt.balance)}
                      </Text>
                      <Text style={[styles.debtMin, { color: colors.textMuted }]}>
                        {fmtCurrency(debt.minimumPayment)}/mo
                      </Text>
                    </View>
                  </View>
                  {/* Balance proportion bar */}
                  <View style={[styles.debtBar, { backgroundColor: `${colors.textMuted}15` }]}>
                    <View style={[styles.debtBarFill, { width: `${pct}%`, backgroundColor: typeColor }]} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.modalContent, {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + SPACING.md,
            }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {editingDebt ? 'Edit Debt' : 'Add Debt'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Name */}
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Name</Text>
                <TextInput
                  style={[styles.input, {
                    color: colors.textPrimary,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    borderColor: colors.border,
                  }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Chase Sapphire"
                  placeholderTextColor={colors.textMuted}
                />

                {/* Debt Type */}
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Type</Text>
                <View style={styles.typeGrid}>
                  {DEBT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeChip,
                        {
                          backgroundColor: selectedType === type ? `${DEBT_TYPE_COLORS[type]}20` : 'transparent',
                          borderColor: selectedType === type ? DEBT_TYPE_COLORS[type] : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedType(type)}
                    >
                      <MaterialIcons
                        name={DEBT_TYPE_ICONS[type] as any}
                        size={16}
                        color={selectedType === type ? DEBT_TYPE_COLORS[type] : colors.textMuted}
                      />
                      <Text
                        style={[styles.typeChipText, {
                          color: selectedType === type ? DEBT_TYPE_COLORS[type] : colors.textPrimary,
                        }]}
                        numberOfLines={1}
                      >
                        {DEBT_TYPE_LABELS[type]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Balance */}
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Current Balance</Text>
                <View style={[styles.inputRow, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: colors.border,
                }]}>
                  <Text style={[styles.inputPrefix, { color: colors.textMuted }]}>{currencySymbol}</Text>
                  <TextInput
                    style={[styles.inputInner, { color: colors.textPrimary }]}
                    value={balance}
                    onChangeText={setBalance}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                {/* Interest Rate */}
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Annual Interest Rate (APR)</Text>
                <View style={[styles.inputRow, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: colors.border,
                }]}>
                  <TextInput
                    style={[styles.inputInner, { color: colors.textPrimary }]}
                    value={interestRate}
                    onChangeText={setInterestRate}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={[styles.inputSuffix, { color: colors.textMuted }]}>%</Text>
                </View>

                {/* Minimum Payment */}
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Minimum Monthly Payment</Text>
                <View style={[styles.inputRow, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: colors.border,
                }]}>
                  <Text style={[styles.inputPrefix, { color: colors.textMuted }]}>{currencySymbol}</Text>
                  <TextInput
                    style={[styles.inputInner, { color: colors.textPrimary }]}
                    value={minimumPayment}
                    onChangeText={setMinimumPayment}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                {error ? (
                  <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                ) : null}

                {/* Save Button */}
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveBtnText}>
                    {editingDebt ? 'Update Debt' : 'Add Debt'}
                  </Text>
                </TouchableOpacity>

                {/* Delete Button */}
                {editingDebt && (
                  <TouchableOpacity
                    style={[styles.deleteBtn, { borderColor: colors.danger }]}
                    onPress={() => {
                      setDebtToDelete(editingDebt);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <MaterialIcons name="delete-outline" size={18} color={colors.danger} />
                    <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Delete Debt</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation */}
      <Modal visible={showDeleteConfirm} animationType="fade" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.confirmCard, {
            backgroundColor: colors.background,
          }]}>
            <MaterialIcons name="warning" size={40} color={colors.danger} />
            <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>
              Delete "{debtToDelete?.name}"?
            </Text>
            <Text style={[styles.confirmSubtitle, { color: colors.textMuted }]}>
              This action can be undone via the snackbar.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: `${colors.textMuted}20` }]}
                onPress={() => { setShowDeleteConfirm(false); setDebtToDelete(null); }}
              >
                <Text style={[styles.confirmBtnText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.danger }]}
                onPress={handleDelete}
              >
                <Text style={[styles.confirmBtnText, { color: '#FFF' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  backBtn: { padding: 4, marginRight: SPACING.sm },
  headerTitle: { flex: 1, fontSize: FONT_SIZE.xl, fontWeight: '800', letterSpacing: -0.3 },
  addBtn: { padding: 4 },
  scrollContent: { paddingHorizontal: SPACING.lg },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { width: 96, height: 96, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800', marginBottom: SPACING.xs },
  emptySubtitle: { fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.lg },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.lg },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: FONT_SIZE.md },

  // Hero
  heroCard: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.lg, marginBottom: SPACING.lg },
  heroLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  heroAmount: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5, marginBottom: SPACING.md },
  heroStats: { flexDirection: 'row', alignItems: 'center' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 2 },
  heroStatValue: { fontSize: FONT_SIZE.md, fontWeight: '800' },
  heroDivider: { width: 1, height: 30, marginHorizontal: SPACING.sm },

  // Strategy
  strategyCard: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: '800', marginBottom: SPACING.sm },
  strategyRow: { flexDirection: 'row', gap: SPACING.sm },
  strategyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  strategyLabel: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  strategyDesc: { fontSize: 10, fontWeight: '500', marginTop: 1 },
  extraRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.md },
  extraLabel: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  extraInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    width: 120,
  },
  extraCurrency: { fontSize: FONT_SIZE.sm, fontWeight: '600', marginRight: 4 },
  extraInput: { flex: 1, fontSize: FONT_SIZE.sm, fontWeight: '700', paddingVertical: 8 },

  // Payoff
  payoffCard: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.lg },
  payoffHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  freeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.sm },
  freeBadgeText: { fontSize: 11, fontWeight: '700' },
  payoffStats: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  payoffStat: { flex: 1, padding: SPACING.sm, borderRadius: BORDER_RADIUS.md },
  payoffStatLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  payoffStatValue: { fontSize: FONT_SIZE.md, fontWeight: '800' },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  savingsText: { fontSize: FONT_SIZE.xs, fontWeight: '600', flex: 1 },

  // Order
  orderCard: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.lg },
  orderItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.sm },
  orderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  orderNumber: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  orderNumText: { fontSize: FONT_SIZE.sm, fontWeight: '800' },
  orderName: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  orderMeta: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  orderRight: { alignItems: 'flex-end', flexShrink: 0 },
  orderBalance: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  orderPayoff: { fontSize: 11, fontWeight: '600', marginTop: 1 },

  // Debt Cards
  debtCard: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.sm },
  debtCardRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  debtIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  debtName: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  debtMeta: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  debtRight: { alignItems: 'flex-end', flexShrink: 0 },
  debtBalance: { fontSize: FONT_SIZE.md, fontWeight: '800' },
  debtMin: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  debtBar: { height: 4, borderRadius: 2, marginTop: SPACING.sm },
  debtBarFill: { height: 4, borderRadius: 2 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  inputLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6, marginTop: SPACING.md },
  input: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
  },
  inputPrefix: { fontSize: FONT_SIZE.md, fontWeight: '600', marginRight: 4 },
  inputSuffix: { fontSize: FONT_SIZE.md, fontWeight: '600', marginLeft: 4 },
  inputInner: { flex: 1, fontSize: FONT_SIZE.md, fontWeight: '600', paddingVertical: 12 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  typeChipText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  errorText: { fontSize: FONT_SIZE.sm, fontWeight: '600', marginTop: SPACING.sm },
  saveBtn: {
    marginTop: SPACING.lg,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFF', fontSize: FONT_SIZE.md, fontWeight: '800' },
  deleteBtn: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  deleteBtnText: { fontSize: FONT_SIZE.md, fontWeight: '700' },

  // Confirm
  confirmCard: {
    marginHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  confirmTitle: { fontSize: FONT_SIZE.lg, fontWeight: '800', marginTop: SPACING.md, textAlign: 'center' },
  confirmSubtitle: { fontSize: FONT_SIZE.sm, marginTop: SPACING.xs, textAlign: 'center' },
  confirmButtons: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg, width: '100%' },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: BORDER_RADIUS.lg, alignItems: 'center' },
  confirmBtnText: { fontSize: FONT_SIZE.md, fontWeight: '700' },
});
