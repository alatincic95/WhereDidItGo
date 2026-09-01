import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExpenseStore } from '../store/useExpenseStore';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils/currency';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../types';

export const TaxReportScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { expenses, currencySymbol, customCategories, convertToBase } = useExpenseStore();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const years = useMemo(() => {
    const ySet = new Set<number>();
    expenses.forEach((e) => {
      if (e.taxDeductible) ySet.add(new Date(e.date).getFullYear());
    });
    ySet.add(currentYear);
    return Array.from(ySet).sort((a, b) => b - a);
  }, [expenses, currentYear]);

  const taxExpenses = useMemo(
    () =>
      expenses
        .filter((e) => e.taxDeductible && new Date(e.date).getFullYear() === selectedYear)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [expenses, selectedYear],
  );

  const totalDeductible = useMemo(
    () => taxExpenses.reduce((sum, e) => sum + convertToBase(e.amount, e.currency), 0),
    [taxExpenses, convertToBase],
  );

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    taxExpenses.forEach((e) => {
      const cat = e.category;
      if (!map[cat]) map[cat] = { total: 0, count: 0 };
      map[cat].total += convertToBase(e.amount, e.currency);
      map[cat].count++;
    });
    return Object.entries(map)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [taxExpenses, convertToBase]);

  const monthlyBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    taxExpenses.forEach((e) => {
      const month = e.date.substring(0, 7);
      map[month] = (map[month] || 0) + convertToBase(e.amount, e.currency);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));
  }, [taxExpenses, convertToBase]);

  const getCatColor = (cat: string) => {
    const custom = customCategories.find((c) => c.name === cat);
    return custom?.color || (CATEGORY_COLORS as any)[cat] || colors.textMuted;
  };

  const getCatIcon = (cat: string) => {
    const custom = customCategories.find((c) => c.name === cat);
    return custom?.icon || (CATEGORY_ICONS as any)[cat] || 'label';
  };

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const formatMonth = (m: string) => {
    const [, mm] = m.split('-');
    return MONTH_NAMES[parseInt(mm, 10) - 1] || m;
  };

  const handleExport = async () => {
    const header = 'Date,Description,Category,Amount,Currency\n';
    const rows = taxExpenses
      .map((e) => {
        const d = e.date.substring(0, 10);
        const desc = e.description.replace(/,/g, ';');
        const cat = e.category;
        const amt = e.amount.toFixed(2);
        const cur = e.currency || currencySymbol;
        return `${d},${desc},${cat},${amt},${cur}`;
      })
      .join('\n');

    const summary = `\nTotal Tax-Deductible (${selectedYear}): ${formatCurrency(totalDeductible)}\n`;
    const catSummary = categoryBreakdown
      .map((c) => `${c.category}: ${formatCurrency(c.total)} (${c.count} expenses)`)
      .join('\n');

    const csv = header + rows + '\n' + summary + '\nBy Category:\n' + catSummary;

    await Share.share({
      message: csv,
      title: `Tax Deductible Expenses ${selectedYear}`,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Tax Report</Text>
        {taxExpenses.length > 0 && (
          <TouchableOpacity onPress={handleExport} style={styles.exportBtn}>
            <MaterialIcons name="file-download" size={22} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Year Selector */}
        <View style={styles.yearRow}>
          {years.map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearChip,
                {
                  backgroundColor: selectedYear === year ? `${colors.primary}20` : 'transparent',
                  borderColor: selectedYear === year ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedYear(year)}
            >
              <Text
                style={[
                  styles.yearChipText,
                  { color: selectedYear === year ? colors.primary : colors.textSecondary },
                ]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {taxExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: `${colors.success}15` }]}>
              <MaterialIcons name="receipt-long" size={48} color={colors.success} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No tax-deductible expenses
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              Toggle "Tax Deductible" when adding or{'\n'}editing an expense to track it here
            </Text>
          </View>
        ) : (
          <>
            {/* Summary Card */}
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: isDark ? 'rgba(22, 33, 62, 0.85)' : colors.backgroundCard,
                  borderColor: isDark ? `${colors.success}30` : colors.border,
                },
              ]}
            >
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                TOTAL DEDUCTIBLE ({selectedYear})
              </Text>
              <Text
                style={[styles.summaryAmount, { color: colors.success }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {formatCurrency(totalDeductible)}
              </Text>
              <Text style={[styles.summaryMeta, { color: colors.textMuted }]}>
                {taxExpenses.length} expense{taxExpenses.length !== 1 ? 's' : ''} across{' '}
                {categoryBreakdown.length} categor{categoryBreakdown.length !== 1 ? 'ies' : 'y'}
              </Text>
            </View>

            {/* Category Breakdown */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>By Category</Text>
            {categoryBreakdown.map((item) => {
              const catColor = getCatColor(item.category);
              const pct = totalDeductible > 0 ? (item.total / totalDeductible) * 100 : 0;
              return (
                <View
                  key={item.category}
                  style={[
                    styles.catRow,
                    {
                      backgroundColor: isDark ? 'rgba(22, 33, 62, 0.85)' : colors.backgroundCard,
                      borderColor: isDark ? `${catColor}25` : colors.border,
                    },
                  ]}
                >
                  <View style={[styles.catIcon, { backgroundColor: `${catColor}18` }]}>
                    <MaterialIcons name={getCatIcon(item.category) as any} size={20} color={catColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.catHeader}>
                      <Text style={[styles.catName, { color: colors.textPrimary }]}>{item.category}</Text>
                      <Text style={[styles.catAmount, { color: colors.textPrimary }]}>
                        {formatCurrency(item.total)}
                      </Text>
                    </View>
                    <View style={[styles.catBar, { backgroundColor: `${colors.textMuted}15` }]}>
                      <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: catColor }]} />
                    </View>
                    <Text style={[styles.catMeta, { color: colors.textMuted }]}>
                      {item.count} expense{item.count !== 1 ? 's' : ''} · {pct.toFixed(0)}%
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* Monthly Breakdown */}
            {monthlyBreakdown.length > 1 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>By Month</Text>
                <View
                  style={[
                    styles.monthCard,
                    {
                      backgroundColor: isDark ? 'rgba(22, 33, 62, 0.85)' : colors.backgroundCard,
                      borderColor: isDark ? `${colors.primary}15` : colors.border,
                    },
                  ]}
                >
                  {monthlyBreakdown.map((item) => {
                    const pct = totalDeductible > 0 ? (item.total / totalDeductible) * 100 : 0;
                    return (
                      <View key={item.month} style={styles.monthRow}>
                        <Text style={[styles.monthLabel, { color: colors.textMuted }]}>
                          {formatMonth(item.month)}
                        </Text>
                        <View style={[styles.monthBar, { backgroundColor: `${colors.textMuted}15` }]}>
                          <View
                            style={[styles.monthBarFill, { width: `${pct}%`, backgroundColor: colors.success }]}
                          />
                        </View>
                        <Text style={[styles.monthAmount, { color: colors.textPrimary }]}>
                          {formatCurrency(item.total)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* Expense List */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>All Expenses</Text>
            {taxExpenses.map((expense) => {
              const catColor = getCatColor(expense.category);
              return (
                <TouchableOpacity
                  key={expense.id}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('AddExpense', { expense })}
                  style={[
                    styles.expenseRow,
                    {
                      backgroundColor: isDark ? 'rgba(22, 33, 62, 0.85)' : colors.backgroundCard,
                      borderColor: isDark ? `${colors.border}40` : colors.border,
                    },
                  ]}
                >
                  <View style={[styles.expDot, { backgroundColor: catColor }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.expDesc, { color: colors.textPrimary }]} numberOfLines={1}>
                      {expense.description || expense.category}
                    </Text>
                    <Text style={[styles.expMeta, { color: colors.textMuted }]}>
                      {expense.date.substring(0, 10)} · {expense.category}
                    </Text>
                  </View>
                  <Text style={[styles.expAmount, { color: colors.textPrimary }]}>
                    {formatCurrency(convertToBase(expense.amount, expense.currency))}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
};

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
  exportBtn: { padding: 4 },
  scrollContent: { paddingHorizontal: SPACING.lg },

  yearRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  yearChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
  },
  yearChipText: { fontSize: FONT_SIZE.sm, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { width: 96, height: 96, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg },
  emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800', marginBottom: SPACING.xs },
  emptySubtitle: { fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20 },

  summaryCard: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.lg, marginBottom: SPACING.lg },
  summaryLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  summaryAmount: { fontSize: 32, fontWeight: '900', letterSpacing: -0.5, marginBottom: SPACING.xs },
  summaryMeta: { fontSize: FONT_SIZE.xs, fontWeight: '500' },

  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: '800', marginBottom: SPACING.sm, marginTop: SPACING.sm },

  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  catIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catName: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  catAmount: { fontSize: FONT_SIZE.sm, fontWeight: '800' },
  catBar: { height: 4, borderRadius: 2, marginTop: 6 },
  catBarFill: { height: 4, borderRadius: 2 },
  catMeta: { fontSize: 11, fontWeight: '500', marginTop: 4 },

  monthCard: { borderRadius: BORDER_RADIUS.lg, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.lg },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  monthLabel: { width: 32, fontSize: FONT_SIZE.xs, fontWeight: '600' },
  monthBar: { flex: 1, height: 6, borderRadius: 3 },
  monthBarFill: { height: 6, borderRadius: 3 },
  monthAmount: { fontSize: FONT_SIZE.xs, fontWeight: '700', width: 70, textAlign: 'right' },

  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  expDot: { width: 8, height: 8, borderRadius: 4 },
  expDesc: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  expMeta: { fontSize: 11, fontWeight: '500', marginTop: 1 },
  expAmount: { fontSize: FONT_SIZE.sm, fontWeight: '700', flexShrink: 0 },
});
