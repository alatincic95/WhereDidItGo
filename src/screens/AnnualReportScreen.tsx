import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { CategoryIcon } from '../components/CategoryIcon';
import { useExpenseStore } from '../store/useExpenseStore';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS, COLORS } from '../constants/theme';
import { formatCurrency } from '../utils/currency';
import { getAnnualReportData, exportAnnualReportCsv, AnnualReportData } from '../utils/annualReport';
import { INCOME_SOURCE_COLORS, INCOME_SOURCE_ICONS } from '../types';

export const AnnualReportScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [exporting, setExporting] = useState(false);

  const expenses = useExpenseStore((s) => s.expenses);
  const incomes = useExpenseStore((s) => s.incomes);
  const fixedExpenses = useExpenseStore((s) => s.fixedExpenses);
  const fixedIncomes = useExpenseStore((s) => s.fixedIncomes);
  const convertToBase = useExpenseStore((s) => s.convertToBase);
  const currencySymbol = useExpenseStore((s) => s.currencySymbol);

  const data: AnnualReportData = useMemo(
    () => getAnnualReportData(selectedYear, expenses, incomes, fixedExpenses, fixedIncomes, convertToBase),
    [selectedYear, expenses, incomes, fixedExpenses, fixedIncomes],
  );

  const maxMonthExpense = Math.max(...data.monthlyBreakdown.map((m) => m.expenses), 1);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAnnualReportCsv(data, currencySymbol);
    } catch {}
    setExporting(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Annual Report</Text>
        <TouchableOpacity
          onPress={handleExport}
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          disabled={exporting}
          accessibilityLabel="Export CSV"
        >
          <MaterialIcons name="file-download" size={22} color={exporting ? colors.textMuted : colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Year Selector */}
      <View style={styles.yearSelector}>
        <TouchableOpacity onPress={() => setSelectedYear((y) => y - 1)}>
          <MaterialIcons name="chevron-left" size={32} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.yearText, { color: colors.textPrimary }]}>{selectedYear}</Text>
        <TouchableOpacity
          onPress={() => setSelectedYear((y) => y + 1)}
          disabled={selectedYear >= new Date().getFullYear()}
        >
          <MaterialIcons
            name="chevron-right"
            size={32}
            color={selectedYear >= new Date().getFullYear() ? colors.textMuted : colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <GlassCard style={{ ...styles.summaryCard, flex: 1 }}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Income</Text>
            <Text style={[styles.summaryAmount, { color: colors.success }]}>
              {formatCurrency(data.totalIncome)}
            </Text>
          </GlassCard>
          <GlassCard style={{ ...styles.summaryCard, flex: 1 }}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Expenses</Text>
            <Text style={[styles.summaryAmount, { color: colors.accent }]}>
              {formatCurrency(data.totalExpenses)}
            </Text>
          </GlassCard>
        </View>

        <GlassCard style={styles.netCard}>
          <View style={styles.netRow}>
            <View>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Net Balance</Text>
              <Text style={[styles.netAmount, { color: data.netBalance >= 0 ? colors.success : colors.danger }]}>
                {data.netBalance >= 0 ? '+' : ''}{formatCurrency(data.netBalance)}
              </Text>
            </View>
            <View style={[styles.netIcon, { backgroundColor: data.netBalance >= 0 ? 'rgba(0, 214, 143, 0.12)' : 'rgba(255, 61, 113, 0.12)' }]}>
              <MaterialIcons
                name={data.netBalance >= 0 ? 'trending-up' : 'trending-down'}
                size={28}
                color={data.netBalance >= 0 ? colors.success : colors.danger}
              />
            </View>
          </View>
        </GlassCard>

        {/* Monthly Chart */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Monthly Breakdown</Text>
        <GlassCard style={styles.chartCard}>
          {data.monthlyBreakdown.map((m, i) => {
            const barWidth = maxMonthExpense > 0 ? (m.expenses / maxMonthExpense) * 100 : 0;
            const isCurrentMonth = m.month === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
            return (
              <View key={m.month} style={styles.chartRow}>
                <Text style={[styles.chartLabel, { color: colors.textMuted }, isCurrentMonth && { color: colors.primary, fontWeight: '700' }]}>
                  {m.label}
                </Text>
                <View style={[styles.chartBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : `${colors.border}40` }]}>
                  <View style={[styles.chartBar, { width: `${barWidth}%`, backgroundColor: colors.accent }]} />
                </View>
                <Text style={[styles.chartAmount, { color: colors.textSecondary }]}>
                  {formatCurrency(m.expenses)}
                </Text>
              </View>
            );
          })}
        </GlassCard>

        {/* Category Breakdown */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Expenses by Category</Text>
        <GlassCard style={styles.categoryCard}>
          {data.categoryBreakdown.length === 0 && (
            <Text style={{ color: colors.textMuted, textAlign: 'center', padding: SPACING.lg }}>No expenses recorded</Text>
          )}
          {data.categoryBreakdown.map((c) => (
            <View key={c.category} style={[styles.categoryRow, { borderBottomColor: colors.border }]}>
              <CategoryIcon category={c.category} size={36} />
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{c.category}</Text>
                <View style={[styles.categoryBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : `${colors.border}40` }]}>
                  <View style={[styles.categoryBar, { width: `${c.percentage}%`, backgroundColor: colors.primary }]} />
                </View>
              </View>
              <View style={styles.categoryRight}>
                <Text style={[styles.categoryAmount, { color: colors.textPrimary }]}>{formatCurrency(c.amount)}</Text>
                <Text style={[styles.categoryPct, { color: colors.textMuted }]}>{c.percentage.toFixed(1)}%</Text>
              </View>
            </View>
          ))}
        </GlassCard>

        {/* Income Source Breakdown */}
        {data.incomeSourceBreakdown.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Income by Source</Text>
            <GlassCard style={styles.categoryCard}>
              {data.incomeSourceBreakdown.map((s) => {
                const color = INCOME_SOURCE_COLORS[s.source as keyof typeof INCOME_SOURCE_COLORS] || '#00D68F';
                const icon = INCOME_SOURCE_ICONS[s.source as keyof typeof INCOME_SOURCE_ICONS] || 'attach-money';
                return (
                  <View key={s.source} style={[styles.categoryRow, { borderBottomColor: colors.border }]}>
                    <View style={[styles.incomeIcon, { backgroundColor: `${color}18`, borderColor: `${color}30` }]}>
                      <MaterialIcons name={icon as any} size={20} color={color} />
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{s.source}</Text>
                      <View style={[styles.categoryBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : `${colors.border}40` }]}>
                        <View style={[styles.categoryBar, { width: `${s.percentage}%`, backgroundColor: colors.success }]} />
                      </View>
                    </View>
                    <View style={styles.categoryRight}>
                      <Text style={[styles.categoryAmount, { color: colors.textPrimary }]}>{formatCurrency(s.amount)}</Text>
                      <Text style={[styles.categoryPct, { color: colors.textMuted }]}>{s.percentage.toFixed(1)}%</Text>
                    </View>
                  </View>
                );
              })}
            </GlassCard>
          </>
        )}

        {/* Monthly Table */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Monthly Summary Table</Text>
        <GlassCard style={styles.tableCard}>
          <View style={[styles.tableHeaderRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.tableHeaderCell, { color: colors.textMuted, flex: 1 }]}>Month</Text>
            <Text style={[styles.tableHeaderCell, { color: colors.textMuted, flex: 1, textAlign: 'right' }]}>Income</Text>
            <Text style={[styles.tableHeaderCell, { color: colors.textMuted, flex: 1, textAlign: 'right' }]}>Expenses</Text>
            <Text style={[styles.tableHeaderCell, { color: colors.textMuted, flex: 1, textAlign: 'right' }]}>Net</Text>
          </View>
          {data.monthlyBreakdown.map((m) => (
            <View key={m.month} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.tableCell, { color: colors.textPrimary, flex: 1 }]}>{m.label}</Text>
              <Text style={[styles.tableCell, { color: colors.success, flex: 1, textAlign: 'right' }]}>{formatCurrency(m.income)}</Text>
              <Text style={[styles.tableCell, { color: colors.accent, flex: 1, textAlign: 'right' }]}>{formatCurrency(m.expenses)}</Text>
              <Text style={[styles.tableCell, { color: m.net >= 0 ? colors.success : colors.danger, flex: 1, textAlign: 'right' }]}>
                {m.net >= 0 ? '+' : ''}{formatCurrency(m.net)}
              </Text>
            </View>
          ))}
        </GlassCard>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xl,
    paddingVertical: SPACING.sm,
  },
  yearText: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  summaryCard: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  summaryLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  netCard: {
    marginBottom: SPACING.lg,
  },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netAmount: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  netIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  chartCard: {
    gap: SPACING.sm,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  chartLabel: {
    width: 32,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  chartBarBg: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  chartBar: {
    height: '100%',
    borderRadius: 8,
  },
  chartAmount: {
    width: 70,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textAlign: 'right',
  },
  categoryCard: {
    gap: 0,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    gap: SPACING.sm,
  },
  categoryInfo: {
    flex: 1,
    gap: 4,
  },
  categoryName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  categoryBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: 3,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  categoryPct: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  incomeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  tableCard: {
    paddingHorizontal: SPACING.sm,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  tableHeaderCell: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.xs + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableCell: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
});
