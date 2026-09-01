import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { useExpenseStore } from '../store/useExpenseStore';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils/currency';
import { generateCashFlowForecast } from '../utils/cashFlowForecast';

type ForecastRange = 3 | 6 | 12;

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_PADDING = SPACING.lg * 2 + SPACING.lg * 2;
const CHART_WIDTH = SCREEN_WIDTH - CHART_PADDING;
const CHART_HEIGHT = 180;

export const CashFlowForecastScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [selectedMonths, setSelectedMonths] = useState<ForecastRange>(6);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const {
    monthlyIncome,
    fixedExpenses,
    fixedIncomes,
    useRecurringAsMonthlyIncome,
    getOverallBalance,
    getFixedExpensesTotal,
    getFixedIncomesTotal,
  } = useExpenseStore();

  const currentBalance = getOverallBalance();
  const recurringIncome = getFixedIncomesTotal();
  const recurringExpenses = getFixedExpensesTotal();
  const netMonthlyCashFlow = recurringIncome + (useRecurringAsMonthlyIncome ? 0 : monthlyIncome) - recurringExpenses;

  const forecast = useMemo(
    () =>
      generateCashFlowForecast(
        currentBalance,
        monthlyIncome,
        fixedExpenses,
        fixedIncomes,
        useRecurringAsMonthlyIncome,
        selectedMonths,
      ),
    [currentBalance, monthlyIncome, fixedExpenses, fixedIncomes, useRecurringAsMonthlyIncome, selectedMonths],
  );

  const negativeMonth = useMemo(
    () => forecast.find((m) => m.projectedBalance < 0),
    [forecast],
  );

  // Chart scaling
  const maxAbsBalance = useMemo(
    () => Math.max(...forecast.map((m) => Math.abs(m.projectedBalance)), 1),
    [forecast],
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const barWidth = forecast.length > 0
    ? Math.min((CHART_WIDTH - (forecast.length - 1) * 6) / forecast.length, 36)
    : 36;

  const rangeOptions: { value: ForecastRange; label: string }[] = [
    { value: 3, label: '3 Mo' },
    { value: 6, label: '6 Mo' },
    { value: 12, label: '12 Mo' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Cash Flow Forecast</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Time Range Selector */}
        <View style={[styles.toggleWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {rangeOptions.map(({ value, label }) => (
            <TouchableOpacity
              key={value}
              style={[styles.toggleBtn, selectedMonths === value && styles.toggleBtnActive]}
              onPress={() => setSelectedMonths(value)}
            >
              {selectedMonths === value ? (
                <LinearGradient
                  colors={['#6C63FF', '#BB8FCE']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.toggleGradient}
                >
                  <Text style={styles.toggleTextActive}>{label}</Text>
                </LinearGradient>
              ) : (
                <Text style={[styles.toggleText, { color: colors.textMuted }]}>{label}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Warning Banner */}
        {negativeMonth && (
          <View style={[styles.warningBanner, { backgroundColor: isDark ? 'rgba(255, 82, 82, 0.15)' : 'rgba(255, 82, 82, 0.1)', borderColor: '#FF5252' }]}>
            <MaterialIcons name="warning" size={20} color="#FF5252" />
            <Text style={[styles.warningText, { color: '#FF5252' }]}>
              Balance projected to go negative in {negativeMonth.label}
            </Text>
          </View>
        )}

        {/* Summary Stats */}
        <GlassCard style={styles.summaryCard} intensity="low">
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Monthly Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(0, 214, 143, 0.15)' }]}>
                <MaterialIcons name="trending-up" size={20} color="#00D68F" />
              </View>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Recurring Income</Text>
              <Text style={[styles.statValue, { color: '#00D68F' }]}>{formatCurrency(recurringIncome + (useRecurringAsMonthlyIncome ? 0 : monthlyIncome))}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(255, 107, 157, 0.15)' }]}>
                <MaterialIcons name="trending-down" size={20} color="#FF6B9D" />
              </View>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Recurring Expenses</Text>
              <Text style={[styles.statValue, { color: '#FF6B9D' }]}>{formatCurrency(recurringExpenses)}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: netMonthlyCashFlow >= 0 ? 'rgba(108, 99, 255, 0.15)' : 'rgba(255, 82, 82, 0.15)' }]}>
                <MaterialIcons name="account-balance-wallet" size={20} color={netMonthlyCashFlow >= 0 ? '#6C63FF' : '#FF5252'} />
              </View>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Net Cash Flow</Text>
              <Text style={[styles.statValue, { color: netMonthlyCashFlow >= 0 ? '#6C63FF' : '#FF5252' }]}>{formatCurrency(netMonthlyCashFlow)}</Text>
            </View>
          </View>
        </GlassCard>

        {/* Projection Chart */}
        <GlassCard style={styles.chartCard} intensity="low">
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Projected Balance</Text>
          <View style={styles.chartContainer}>
            {/* Y-axis labels */}
            <View style={styles.yAxis}>
              <Text style={[styles.yLabel, { color: colors.textMuted }]}>{formatCurrency(maxAbsBalance)}</Text>
              <Text style={[styles.yLabel, { color: colors.textMuted }]}>{formatCurrency(0)}</Text>
              {forecast.some((m) => m.projectedBalance < 0) && (
                <Text style={[styles.yLabel, { color: colors.textMuted }]}>{formatCurrency(-maxAbsBalance)}</Text>
              )}
            </View>

            {/* Bars area */}
            <View style={styles.barsArea}>
              {/* Grid lines */}
              <View style={[styles.gridLine, { top: 0, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]} />
              <View style={[styles.gridLine, { top: '50%', borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : colors.textMuted }]} />
              {forecast.some((m) => m.projectedBalance < 0) && (
                <View style={[styles.gridLine, { bottom: 0, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]} />
              )}

              {/* Zero line */}
              <View style={[styles.zeroLine, {
                top: forecast.some((m) => m.projectedBalance < 0) ? '50%' : undefined,
                bottom: forecast.some((m) => m.projectedBalance < 0) ? undefined : 24,
                borderBottomColor: isDark ? 'rgba(255,255,255,0.2)' : colors.textMuted,
              }]} />

              {/* Bars */}
              <View style={styles.barsContainer}>
                {forecast.map((item) => {
                  const hasNegative = forecast.some((m) => m.projectedBalance < 0);
                  const barHeight = (Math.abs(item.projectedBalance) / maxAbsBalance) * (hasNegative ? (CHART_HEIGHT - 24) / 2 : CHART_HEIGHT - 24);
                  const isNegative = item.projectedBalance < 0;

                  return (
                    <View key={item.month} style={styles.barGroup}>
                      <View style={[styles.barWrapper, { height: CHART_HEIGHT - 24 }]}>
                        {hasNegative ? (
                          <>
                            {/* Top half (positive) */}
                            <View style={styles.barHalf}>
                              {!isNegative && (
                                <View style={[styles.bar, {
                                  width: barWidth,
                                  height: Math.max(barHeight, 2),
                                  backgroundColor: '#00D68F',
                                  borderRadius: 4,
                                  alignSelf: 'flex-end',
                                }]} />
                              )}
                            </View>
                            {/* Bottom half (negative) */}
                            <View style={styles.barHalf}>
                              {isNegative && (
                                <View style={[styles.bar, {
                                  width: barWidth,
                                  height: Math.max(barHeight, 2),
                                  backgroundColor: '#FF5252',
                                  borderRadius: 4,
                                  alignSelf: 'flex-start',
                                }]} />
                              )}
                            </View>
                          </>
                        ) : (
                          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                            <View style={[styles.bar, {
                              width: barWidth,
                              height: Math.max(barHeight, 2),
                              backgroundColor: '#00D68F',
                              borderRadius: 4,
                            }]} />
                          </View>
                        )}
                      </View>
                      <Text style={[styles.barLabel, { color: colors.textMuted }]}>{item.label.slice(0, 3)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </GlassCard>

        {/* Monthly Summary Table */}
        <GlassCard style={styles.tableCard} intensity="low">
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Monthly Forecast</Text>

          {/* Table Header */}
          <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.tableHeaderText, { flex: 1, color: colors.textMuted }]}>Month</Text>
            <Text style={[styles.tableHeaderText, { width: 75, textAlign: 'right', color: colors.textMuted }]}>Income</Text>
            <Text style={[styles.tableHeaderText, { width: 75, textAlign: 'right', color: colors.textMuted }]}>Expenses</Text>
            <Text style={[styles.tableHeaderText, { width: 75, textAlign: 'right', color: colors.textMuted }]}>Balance</Text>
          </View>

          {/* Table Rows */}
          {forecast.map((item) => (
            <View
              key={item.month}
              style={[
                styles.tableRow,
                { borderBottomColor: isDark ? 'rgba(42, 45, 74, 0.5)' : colors.border },
              ]}
            >
              <Text style={[styles.tableCell, { flex: 1, color: colors.textPrimary }]}>{item.label}</Text>
              <Text style={[styles.tableCellAmount, { width: 75, color: '#00D68F' }]}>
                {formatCurrency(item.projectedIncome)}
              </Text>
              <Text style={[styles.tableCellAmount, { width: 75, color: '#FF6B9D' }]}>
                {formatCurrency(item.projectedExpenses)}
              </Text>
              <Text
                style={[
                  styles.tableCellAmount,
                  { width: 75, color: item.projectedBalance >= 0 ? colors.textPrimary : '#FF5252', fontWeight: '700' },
                ]}
              >
                {formatCurrency(item.projectedBalance)}
              </Text>
            </View>
          ))}
        </GlassCard>

        {/* Net Cash Flow per month cards */}
        <GlassCard style={styles.detailCard} intensity="low">
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Net Cash Flow by Month</Text>
          {forecast.map((item) => {
            const isPositive = item.netCashFlow >= 0;
            return (
              <View
                key={item.month}
                style={[
                  styles.flowRow,
                  { borderBottomColor: isDark ? 'rgba(42, 45, 74, 0.5)' : colors.border },
                ]}
              >
                <View style={styles.flowMonth}>
                  <MaterialIcons
                    name={isPositive ? 'arrow-upward' : 'arrow-downward'}
                    size={16}
                    color={isPositive ? '#00D68F' : '#FF5252'}
                  />
                  <Text style={[styles.flowMonthText, { color: colors.textPrimary }]}>{item.label}</Text>
                </View>
                <Text style={[styles.flowAmount, { color: isPositive ? '#00D68F' : '#FF5252' }]}>
                  {isPositive ? '+' : ''}{formatCurrency(item.netCashFlow)}
                </Text>
              </View>
            );
          })}
        </GlassCard>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
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
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },

  // Toggle
  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.round,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.round,
  },
  toggleBtnActive: {
    overflow: 'hidden',
  },
  toggleGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.round,
    width: '100%',
  },
  toggleText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  toggleTextActive: {
    fontSize: FONT_SIZE.md,
    color: '#FFF',
    fontWeight: '700',
  },

  // Warning
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  warningText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    flex: 1,
  },

  // Summary Stats
  summaryCard: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Chart
  chartCard: {
    marginBottom: SPACING.lg,
  },
  chartContainer: {
    flexDirection: 'row',
    height: CHART_HEIGHT,
    marginTop: SPACING.sm,
  },
  yAxis: {
    width: 60,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  yLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  barsArea: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  zeroLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    paddingBottom: 24,
  },
  barGroup: {
    alignItems: 'center',
  },
  barWrapper: {
    justifyContent: 'center',
  },
  barHalf: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    alignSelf: 'center',
  },
  barLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 4,
  },

  // Table
  tableCard: {
    marginBottom: SPACING.lg,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    marginBottom: SPACING.xs,
  },
  tableHeaderText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  tableCellAmount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textAlign: 'right',
  },

  // Net cash flow detail
  detailCard: {
    marginBottom: SPACING.lg,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  flowMonth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  flowMonthText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  flowAmount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});
