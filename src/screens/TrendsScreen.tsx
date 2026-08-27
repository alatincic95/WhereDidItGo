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
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils/currency';

import { TrendTimeRange, YoYMonthData } from '../types';

type ChartMode = 'expenses' | 'income' | 'both';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_PADDING = SPACING.lg * 2 + SPACING.lg * 2; // screen + card padding
const CHART_WIDTH = SCREEN_WIDTH - CHART_PADDING;

const YEAR_COLORS: string[][] = [
  ['#6C63FF', '#BB8FCE'], // purple
  ['#FF6B9D', '#FF8E53'], // pink-orange
  ['#00D68F', '#45B7D1'], // green-blue
];

const formatMonth = (m: string) => {
  const [year, month] = m.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month, 10) - 1]} '${year.slice(2)}`;
};

export const TrendsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const [chartMode, setChartMode] = useState<ChartMode>('both');
  const [timeRange, setTimeRange] = useState<TrendTimeRange>('6m');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const {
    getMonthlyTotalsHistory,
    getMonthlyCategoryHistory,
    getYearOverYearData,
    currencySymbol,
  } = useExpenseStore();

  const history = getMonthlyTotalsHistory();
  const categoryHistory = getMonthlyCategoryHistory();
  const yoyData = getYearOverYearData();

  const displayHistory = timeRange === '12m' ? history.slice(-12) : history.slice(-6);
  const maxValue = Math.max(
    ...displayHistory.map((h) =>
      chartMode === 'expenses' ? h.expenses :
      chartMode === 'income' ? h.income :
      Math.max(h.expenses, h.income)
    ),
    1
  );

  // YoY max value
  const yoyMaxValue = Math.max(
    ...yoyData.flatMap((m) => m.years.flatMap((y) =>
      chartMode === 'expenses' ? [y.expenses] :
      chartMode === 'income' ? [y.income] :
      [y.expenses, y.income]
    )),
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

  // YoY comparison for current month
  const now = new Date();
  const currentMonthIndex = now.getMonth();
  const yoyCurrentMonth = yoyData.find((m) => m.monthIndex === currentMonthIndex);
  const yoyChange = yoyCurrentMonth && yoyCurrentMonth.years.length >= 2
    ? (() => {
        const latest = yoyCurrentMonth.years[yoyCurrentMonth.years.length - 1];
        const prev = yoyCurrentMonth.years[yoyCurrentMonth.years.length - 2];
        return prev.expenses > 0
          ? ((latest.expenses - prev.expenses) / prev.expenses) * 100
          : null;
      })()
    : null;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const barCount = displayHistory.length;
  const barWidth = barCount > 0
    ? Math.min((CHART_WIDTH - (barCount - 1) * 8) / (barCount * (chartMode === 'both' ? 2 : 1)), 32)
    : 32;

  // YoY bar width calculation
  const maxYears = Math.max(...yoyData.map((m) => m.years.length), 1);
  const yoyBarCount = yoyData.length;
  const yoyBarWidth = yoyBarCount > 0
    ? Math.min((CHART_WIDTH - (yoyBarCount - 1) * 8) / (yoyBarCount * maxYears * (chartMode === 'both' ? 2 : 1)), 24)
    : 24;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Trends</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Time Range Toggle */}
        <View style={[styles.toggleWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {([['6m', '6 Mo'], ['12m', '12 Mo'], ['yoy', 'Year over Year']] as [TrendTimeRange, string][]).map(([range, label]) => (
            <TouchableOpacity
              key={range}
              style={[styles.toggleBtn, timeRange === range && styles.toggleBtnActive]}
              onPress={() => setTimeRange(range)}
            >
              {timeRange === range ? (
                <LinearGradient colors={['#6C63FF', '#BB8FCE']} style={styles.toggleGradient}>
                  <Text style={styles.toggleTextActive}>{label}</Text>
                </LinearGradient>
              ) : (
                <Text style={[styles.toggleText, { color: colors.textMuted }]}>{label}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart Mode Toggle */}
        <View style={[styles.toggleWrapper, { marginBottom: SPACING.lg, backgroundColor: colors.surface, borderColor: colors.border }]}>
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
                <Text style={[styles.toggleText, { color: colors.textMuted }]}>
                  {mode === 'both' ? 'Both' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Month-over-Month / YoY Summary */}
        {timeRange !== 'yoy' && expenseChange !== null && (
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
                <Text style={[styles.changeLabel, { color: colors.textMuted }]}>vs Last Month</Text>
                <Text style={[styles.changeValue, { color: expenseChange > 0 ? COLORS.danger : COLORS.success }]}>
                  {expenseChange > 0 ? '+' : ''}{expenseChange.toFixed(1)}% spending
                </Text>
              </View>
              <View>
                <Text style={[styles.changeAmount, { color: colors.textPrimary }]}>
                  {formatCurrency(currentMonth?.expenses || 0)}
                </Text>
                <Text style={[styles.changePrev, { color: colors.textMuted }]}>
                  from {formatCurrency(prevMonth?.expenses || 0)}
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {timeRange === 'yoy' && yoyChange !== null && yoyCurrentMonth && (
          <GlassCard style={styles.changeCard} glowColor={yoyChange > 0 ? COLORS.danger : COLORS.success} intensity="low">
            <View style={styles.changeRow}>
              <View style={[styles.changeIcon, { backgroundColor: yoyChange > 0 ? 'rgba(255, 61, 113, 0.12)' : 'rgba(0, 214, 143, 0.12)' }]}>
                <MaterialIcons
                  name={yoyChange > 0 ? 'trending-up' : 'trending-down'}
                  size={22}
                  color={yoyChange > 0 ? COLORS.danger : COLORS.success}
                />
              </View>
              <View style={styles.changeInfo}>
                <Text style={[styles.changeLabel, { color: colors.textMuted }]}>
                  {yoyCurrentMonth.monthLabel} {yoyCurrentMonth.years[yoyCurrentMonth.years.length - 1].year} vs {yoyCurrentMonth.years[yoyCurrentMonth.years.length - 2].year}
                </Text>
                <Text style={[styles.changeValue, { color: yoyChange > 0 ? COLORS.danger : COLORS.success }]}>
                  {yoyChange > 0 ? '+' : ''}{yoyChange.toFixed(1)}% spending
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Bar Chart — standard (6m/12m) */}
        {timeRange !== 'yoy' && (
          <GlassCard style={styles.chartCard} intensity="low">
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Monthly Overview</Text>
            {displayHistory.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No data yet. Start tracking expenses to see trends.</Text>
            ) : (
              <>
                <View style={styles.chartContainer}>
                  <View style={styles.yAxis}>
                    <Text style={[styles.yLabel, { color: colors.textMuted }]}>{formatCurrency(maxValue)}</Text>
                    <Text style={[styles.yLabel, { color: colors.textMuted }]}>{formatCurrency(maxValue / 2)}</Text>
                    <Text style={[styles.yLabel, { color: colors.textMuted }]}>{currencySymbol}0</Text>
                  </View>
                  <View style={styles.barsContainer}>
                    <View style={[styles.gridLine, { bottom: '100%', backgroundColor: isDark ? 'rgba(108, 99, 255, 0.08)' : colors.border }]} />
                    <View style={[styles.gridLine, { bottom: '50%', backgroundColor: isDark ? 'rgba(108, 99, 255, 0.08)' : colors.border }]} />
                    <View style={[styles.gridLine, { bottom: 0, backgroundColor: isDark ? 'rgba(108, 99, 255, 0.08)' : colors.border }]} />

                    {displayHistory.map((item) => {
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
                          <Text style={[styles.barLabel, { color: colors.textMuted }]}>{formatMonth(item.month)}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
                {chartMode === 'both' && (
                  <View style={styles.legend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#FF6B9D' }]} />
                      <Text style={[styles.legendText, { color: colors.textSecondary }]}>Expenses</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#00D68F' }]} />
                      <Text style={[styles.legendText, { color: colors.textSecondary }]}>Income</Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </GlassCard>
        )}

        {/* Bar Chart — Year over Year */}
        {timeRange === 'yoy' && (
          <GlassCard style={styles.chartCard} intensity="low">
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Year-over-Year Comparison</Text>
            {yoyData.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No data yet. Start tracking expenses to see trends.</Text>
            ) : (
              <>
                <View style={styles.chartContainer}>
                  <View style={styles.yAxis}>
                    <Text style={[styles.yLabel, { color: colors.textMuted }]}>{formatCurrency(yoyMaxValue)}</Text>
                    <Text style={[styles.yLabel, { color: colors.textMuted }]}>{formatCurrency(yoyMaxValue / 2)}</Text>
                    <Text style={[styles.yLabel, { color: colors.textMuted }]}>{currencySymbol}0</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                    <View style={[styles.barsContainer, { minWidth: yoyBarCount * (maxYears * yoyBarWidth * (chartMode === 'both' ? 2 : 1) + 16) }]}>
                      <View style={[styles.gridLine, { bottom: '100%', backgroundColor: isDark ? 'rgba(108, 99, 255, 0.08)' : colors.border }]} />
                      <View style={[styles.gridLine, { bottom: '50%', backgroundColor: isDark ? 'rgba(108, 99, 255, 0.08)' : colors.border }]} />
                      <View style={[styles.gridLine, { bottom: 0, backgroundColor: isDark ? 'rgba(108, 99, 255, 0.08)' : colors.border }]} />

                      {yoyData.map((monthData) => (
                        <View key={monthData.monthIndex} style={styles.barGroup}>
                          <View style={styles.barPair}>
                            {monthData.years.map((yearData, yearIdx) => {
                              const expHeight = (yearData.expenses / yoyMaxValue) * 100;
                              const incHeight = (yearData.income / yoyMaxValue) * 100;
                              const yearColors = YEAR_COLORS[yearIdx % YEAR_COLORS.length];
                              return (
                                <React.Fragment key={yearData.year}>
                                  {(chartMode === 'expenses' || chartMode === 'both') && (
                                    <View style={[styles.barWrapper, { width: yoyBarWidth }]}>
                                      <LinearGradient
                                        colors={yearColors as [string, string]}
                                        style={[styles.bar, { height: `${Math.max(expHeight, 2)}%` }]}
                                      />
                                    </View>
                                  )}
                                  {(chartMode === 'income' || chartMode === 'both') && (
                                    <View style={[styles.barWrapper, { width: yoyBarWidth }]}>
                                      <LinearGradient
                                        colors={yearColors as [string, string]}
                                        style={[styles.bar, { height: `${Math.max(incHeight, 2)}%`, opacity: 0.5 }]}
                                      />
                                    </View>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </View>
                          <Text style={[styles.barLabel, { color: colors.textMuted }]}>{monthData.monthLabel}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                {/* Year Legend */}
                <View style={styles.legend}>
                  {yoyData.length > 0 && yoyData[0].years.map((y, idx) => (
                    <View key={y.year} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: YEAR_COLORS[idx % YEAR_COLORS.length][0] }]} />
                      <Text style={[styles.legendText, { color: colors.textSecondary }]}>{y.year}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </GlassCard>
        )}

        {/* Category Breakdown for Current Month */}
        <GlassCard style={styles.categoryCard} intensity="low">
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Category Breakdown</Text>
          <Text style={[styles.categorySubtitle, { color: colors.textMuted }]}>This month</Text>
          {sortedCategories.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No expenses this month</Text>
          ) : (
            sortedCategories.map(([category, amount]) => {
              const percentage = (amount / maxCatValue) * 100;
              return (
                <View key={category} style={styles.categoryRow}>
                  <CategoryIcon category={category} size={36} />
                  <View style={styles.categoryInfo}>
                    <View style={styles.categoryHeader}>
                      <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{category}</Text>
                      <Text style={[styles.categoryAmount, { color: colors.textSecondary }]}>{formatCurrency(amount)}</Text>
                    </View>
                    <View style={[styles.categoryBar, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : `${colors.border}` }]}>
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
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {timeRange === 'yoy' ? 'Year-over-Year Summary' : 'Monthly Summary'}
          </Text>
          {timeRange !== 'yoy' ? (
            <>
              <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.tableHeaderText, { flex: 1, color: colors.textMuted }]}>Month</Text>
                <Text style={[styles.tableHeaderText, { width: 90, textAlign: 'right', color: colors.textMuted }]}>Expenses</Text>
                <Text style={[styles.tableHeaderText, { width: 90, textAlign: 'right', color: colors.textMuted }]}>Income</Text>
              </View>
              {[...displayHistory].reverse().map((item) => (
                <View key={item.month} style={[styles.tableRow, { borderBottomColor: isDark ? 'rgba(42, 45, 74, 0.5)' : colors.border }]}>
                  <Text style={[styles.tableCell, { flex: 1, color: colors.textPrimary }]}>{formatMonth(item.month)}</Text>
                  <Text style={[styles.tableCellAmount, { width: 90, color: COLORS.accent }]}>
                    {formatCurrency(item.expenses)}
                  </Text>
                  <Text style={[styles.tableCellAmount, { width: 90, color: COLORS.success }]}>
                    {formatCurrency(item.income)}
                  </Text>
                </View>
              ))}
            </>
          ) : (
            <>
              <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.tableHeaderText, { flex: 1, color: colors.textMuted }]}>Month</Text>
                {yoyData.length > 0 && yoyData[0].years.map((y) => (
                  <Text key={y.year} style={[styles.tableHeaderText, { width: 80, textAlign: 'right', color: colors.textMuted }]}>{y.year}</Text>
                ))}
              </View>
              {yoyData.map((monthData) => (
                <View key={monthData.monthIndex} style={[styles.tableRow, { borderBottomColor: isDark ? 'rgba(42, 45, 74, 0.5)' : colors.border }]}>
                  <Text style={[styles.tableCell, { flex: 1, color: colors.textPrimary }]}>{monthData.monthLabel}</Text>
                  {monthData.years.map((y) => (
                    <Text key={y.year} style={[styles.tableCellAmount, { width: 80, color: COLORS.accent }]}>
                      {formatCurrency(y.expenses)}
                    </Text>
                  ))}
                </View>
              ))}
            </>
          )}
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
