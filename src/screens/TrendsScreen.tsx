import React, { useState, useRef, useEffect } from 'react';
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
import { GlassCard } from '../components/GlassCard';
import { CategoryIcon } from '../components/CategoryIcon';
import { useExpenseStore } from '../store/useExpenseStore';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { formatCurrency } from '../utils/currency';

type ChartMode = 'expenses' | 'income' | 'both';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_PADDING = SPACING.lg * 2 + SPACING.lg * 2; // screen + card padding
const CHART_WIDTH = SCREEN_WIDTH - CHART_PADDING;

const formatMonth = (m: string) => {
  const [year, month] = m.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month, 10) - 1]} '${year.slice(2)}`;
};

export const TrendsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [chartMode, setChartMode] = useState<ChartMode>('both');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const {
    getMonthlyTotalsHistory,
    getMonthlyCategoryHistory,
    currencySymbol,
  } = useExpenseStore();

  const history = getMonthlyTotalsHistory();
  const categoryHistory = getMonthlyCategoryHistory();

  // Show last 6 months
  const displayHistory = history.slice(-6);
  const maxValue = Math.max(
    ...displayHistory.map((h) =>
      chartMode === 'expenses' ? h.expenses :
      chartMode === 'income' ? h.income :
      Math.max(h.expenses, h.income)
    ),
    1
  );

  // Category totals for current month
  const currentCategoryData = categoryHistory.length > 0
    ? categoryHistory[categoryHistory.length - 1].categories
    : {};
  const sortedCategories = Object.entries(currentCategoryData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);
  const maxCatValue = sortedCategories.length > 0 ? sortedCategories[0][1] : 1;

  // Month-over-month change
  const currentMonth = displayHistory.length > 0 ? displayHistory[displayHistory.length - 1] : null;
  const prevMonth = displayHistory.length > 1 ? displayHistory[displayHistory.length - 2] : null;
  const expenseChange = currentMonth && prevMonth && prevMonth.expenses > 0
    ? ((currentMonth.expenses - prevMonth.expenses) / prevMonth.expenses) * 100
    : null;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const barWidth = displayHistory.length > 0
    ? Math.min((CHART_WIDTH - (displayHistory.length - 1) * 8) / (displayHistory.length * (chartMode === 'both' ? 2 : 1)), 32)
    : 32;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trends</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Chart Mode Toggle */}
        <View style={styles.toggleWrapper}>
          {(['expenses', 'income', 'both'] as ChartMode[]).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.toggleBtn, chartMode === mode && styles.toggleBtnActive]}
              onPress={() => setChartMode(mode)}
            >
              {chartMode === mode ? (
                <LinearGradient
                  colors={
                    mode === 'expenses' ? ['#FF6B9D', '#FF8E53'] :
                    mode === 'income' ? ['#00D68F', '#45B7D1'] :
                    ['#6C63FF', '#BB8FCE']
                  }
                  style={styles.toggleGradient}
                >
                  <Text style={styles.toggleTextActive}>
                    {mode === 'both' ? 'Both' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </LinearGradient>
              ) : (
                <Text style={styles.toggleText}>
                  {mode === 'both' ? 'Both' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Month-over-Month Summary */}
        {expenseChange !== null && (
          <GlassCard style={styles.changeCard} glowColor={expenseChange > 0 ? COLORS.danger : COLORS.success} intensity="low">
            <View style={styles.changeRow}>
              <View style={[styles.changeIcon, { backgroundColor: expenseChange > 0 ? 'rgba(255, 61, 113, 0.12)' : 'rgba(0, 214, 143, 0.12)' }]}>
                <MaterialIcons
                  name={expenseChange > 0 ? 'trending-up' : 'trending-down'}
                  size={22}
                  color={expenseChange > 0 ? COLORS.danger : COLORS.success}
                />
              </View>
              <View style={styles.changeInfo}>
                <Text style={styles.changeLabel}>vs Last Month</Text>
                <Text style={[styles.changeValue, { color: expenseChange > 0 ? COLORS.danger : COLORS.success }]}>
                  {expenseChange > 0 ? '+' : ''}{expenseChange.toFixed(1)}% spending
                </Text>
              </View>
              <View>
                <Text style={styles.changeAmount}>
                  {formatCurrency(currentMonth?.expenses || 0)}
                </Text>
                <Text style={styles.changePrev}>
                  from {formatCurrency(prevMonth?.expenses || 0)}
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Bar Chart */}
        <GlassCard style={styles.chartCard} intensity="low">
          <Text style={styles.sectionTitle}>Monthly Overview</Text>
          {displayHistory.length === 0 ? (
            <Text style={styles.emptyText}>No data yet. Start tracking expenses to see trends.</Text>
          ) : (
            <>
              {/* Y-axis labels */}
              <View style={styles.chartContainer}>
                <View style={styles.yAxis}>
                  <Text style={styles.yLabel}>{formatCurrency(maxValue)}</Text>
                  <Text style={styles.yLabel}>{formatCurrency(maxValue / 2)}</Text>
                  <Text style={styles.yLabel}>{currencySymbol}0</Text>
                </View>

                {/* Bars */}
                <View style={styles.barsContainer}>
                  {/* Grid lines */}
                  <View style={[styles.gridLine, { bottom: '100%' }]} />
                  <View style={[styles.gridLine, { bottom: '50%' }]} />
                  <View style={[styles.gridLine, { bottom: 0 }]} />

                  {displayHistory.map((item, index) => {
                    const expenseHeight = (item.expenses / maxValue) * 100;
                    const incomeHeight = (item.income / maxValue) * 100;

                    return (
                      <View key={item.month} style={styles.barGroup}>
                        <View style={styles.barPair}>
                          {(chartMode === 'expenses' || chartMode === 'both') && (
                            <View style={[styles.barWrapper, { width: barWidth }]}>
                              <LinearGradient
                                colors={['#FF6B9D', '#FF8E53']}
                                style={[styles.bar, { height: `${Math.max(expenseHeight, 2)}%` }]}
                              />
                            </View>
                          )}
                          {(chartMode === 'income' || chartMode === 'both') && (
                            <View style={[styles.barWrapper, { width: barWidth }]}>
                              <LinearGradient
                                colors={['#00D68F', '#45B7D1']}
                                style={[styles.bar, { height: `${Math.max(incomeHeight, 2)}%` }]}
                              />
                            </View>
                          )}
                        </View>
                        <Text style={styles.barLabel}>{formatMonth(item.month)}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Legend */}
              {chartMode === 'both' && (
                <View style={styles.legend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#FF6B9D' }]} />
                    <Text style={styles.legendText}>Expenses</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#00D68F' }]} />
                    <Text style={styles.legendText}>Income</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </GlassCard>

        {/* Category Breakdown for Current Month */}
        <GlassCard style={styles.categoryCard} intensity="low">
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          <Text style={styles.categorySubtitle}>This month</Text>
          {sortedCategories.length === 0 ? (
            <Text style={styles.emptyText}>No expenses this month</Text>
          ) : (
            sortedCategories.map(([category, amount]) => {
              const percentage = (amount / maxCatValue) * 100;
              return (
                <View key={category} style={styles.categoryRow}>
                  <CategoryIcon category={category} size={36} />
                  <View style={styles.categoryInfo}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryName}>{category}</Text>
                      <Text style={styles.categoryAmount}>{formatCurrency(amount)}</Text>
                    </View>
                    <View style={styles.categoryBar}>
                      <View style={[styles.categoryBarFill, { width: `${percentage}%` }]} />
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </GlassCard>

        {/* Monthly Summary Table */}
        <GlassCard style={styles.tableCard} intensity="low">
          <Text style={styles.sectionTitle}>Monthly Summary</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Month</Text>
            <Text style={[styles.tableHeaderText, { width: 90, textAlign: 'right' }]}>Expenses</Text>
            <Text style={[styles.tableHeaderText, { width: 90, textAlign: 'right' }]}>Income</Text>
          </View>
          {[...displayHistory].reverse().map((item) => {
            const net = item.income - item.expenses;
            return (
              <View key={item.month} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 1 }]}>{formatMonth(item.month)}</Text>
                <Text style={[styles.tableCellAmount, { width: 90, color: COLORS.accent }]}>
                  {formatCurrency(item.expenses)}
                </Text>
                <Text style={[styles.tableCellAmount, { width: 90, color: COLORS.success }]}>
                  {formatCurrency(item.income)}
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
    fontSize: FONT_SIZE.xxl,
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

  // Change Card
  changeCard: {
    marginBottom: SPACING.lg,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  changeInfo: {
    flex: 1,
  },
  changeLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  changeValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  changeAmount: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
    textAlign: 'right',
  },
  changePrev: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'right',
  },

  // Chart
  chartCard: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: SPACING.md,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 200,
    marginTop: SPACING.sm,
  },
  yAxis: {
    width: 60,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  yLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: 24,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
  },
  barGroup: {
    alignItems: 'center',
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: '100%',
  },
  barWrapper: {
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 4,
    minHeight: 4,
    width: '100%',
  },
  barLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 6,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginTop: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Category
  categoryCard: {
    marginBottom: SPACING.lg,
  },
  categorySubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: -SPACING.sm,
    marginBottom: SPACING.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  categoryInfo: { flex: 1 },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: { fontSize: FONT_SIZE.md, color: COLORS.textPrimary, fontWeight: '600' },
  categoryAmount: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, fontWeight: '600' },
  categoryBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },

  // Table
  tableCard: {
    marginBottom: SPACING.lg,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  tableHeaderText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(42, 45, 74, 0.5)',
  },
  tableCell: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  tableCellAmount: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    textAlign: 'right',
  },

  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'center',
    marginVertical: SPACING.xl,
  },
});
