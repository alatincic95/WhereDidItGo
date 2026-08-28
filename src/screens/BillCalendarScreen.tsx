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
import { useExpenseStore } from '../store/useExpenseStore';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { CategoryIcon } from '../components/CategoryIcon';
import { GlassCard } from '../components/GlassCard';
import { formatCurrency } from '../utils/currency';
import {
  FREQUENCY_OPTIONS,
  FREQUENCY_TO_MONTHLY,
  RecurringFrequency,
  INCOME_SOURCE_ICONS,
  INCOME_SOURCE_COLORS,
} from '../types';

function getNextDueDates(
  frequency: RecurringFrequency,
  count: number,
): Date[] {
  const today = new Date();
  const dates: Date[] = [];
  let cursor = new Date(today);

  for (let i = 0; i < count; i++) {
    switch (frequency) {
      case 'weekly':
        cursor = new Date(cursor);
        cursor.setDate(cursor.getDate() + 7);
        break;
      case 'biweekly':
        cursor = new Date(cursor);
        cursor.setDate(cursor.getDate() + 14);
        break;
      case 'monthly':
        cursor = new Date(cursor);
        cursor.setMonth(cursor.getMonth() + 1);
        break;
      case 'quarterly':
        cursor = new Date(cursor);
        cursor.setMonth(cursor.getMonth() + 3);
        break;
      case 'yearly':
        cursor = new Date(cursor);
        cursor.setFullYear(cursor.getFullYear() + 1);
        break;
    }
    dates.push(new Date(cursor));
  }
  return dates;
}

interface UpcomingBill {
  id: string;
  description: string;
  amount: number;
  date: Date;
  type: 'expense' | 'income';
  category?: string;
  source?: string;
  frequency: RecurringFrequency;
  paused?: boolean;
}

export const BillCalendarScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { fixedExpenses, fixedIncomes } = useExpenseStore();
  const [monthOffset, setMonthOffset] = useState(0);

  const viewDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const viewMonth = viewDate.getMonth();
  const viewYear = viewDate.getFullYear();
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const upcomingBills = useMemo((): UpcomingBill[] => {
    const bills: UpcomingBill[] = [];

    fixedExpenses.forEach((fe) => {
      if (fe.paused) return;
      const freq = fe.frequency || 'monthly';
      const nextDates = getNextDueDates(freq, 12);
      nextDates.forEach((date) => {
        if (date.getMonth() === viewMonth && date.getFullYear() === viewYear) {
          bills.push({
            id: `exp-${fe.id}-${date.toISOString()}`,
            description: fe.description,
            amount: fe.amount,
            date,
            type: 'expense',
            category: fe.category,
            frequency: freq,
          });
        }
      });
    });

    fixedIncomes.forEach((fi) => {
      if (fi.paused) return;
      const freq = fi.frequency || 'monthly';
      const nextDates = getNextDueDates(freq, 12);
      nextDates.forEach((date) => {
        if (date.getMonth() === viewMonth && date.getFullYear() === viewYear) {
          bills.push({
            id: `inc-${fi.id}-${date.toISOString()}`,
            description: fi.description,
            amount: fi.amount,
            date,
            type: 'income',
            source: fi.source,
            frequency: freq,
          });
        }
      });
    });

    return bills.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [fixedExpenses, fixedIncomes, viewMonth, viewYear]);

  const totalExpenses = upcomingBills
    .filter((b) => b.type === 'expense')
    .reduce((s, b) => s + b.amount, 0);
  const totalIncome = upcomingBills
    .filter((b) => b.type === 'income')
    .reduce((s, b) => s + b.amount, 0);

  // Group by day
  const grouped = useMemo(() => {
    const map: Record<string, UpcomingBill[]> = {};
    upcomingBills.forEach((bill) => {
      const key = bill.date.toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(bill);
    });
    return Object.entries(map);
  }, [upcomingBills]);

  // Build calendar grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const billDays = new Set(upcomingBills.map((b) => b.date.getDate()));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Bill Calendar</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Month Navigator */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => setMonthOffset((p) => p - 1)} style={styles.monthNavBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="chevron-left" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: colors.textPrimary }]}>{monthLabel}</Text>
          <TouchableOpacity onPress={() => setMonthOffset((p) => p + 1)} style={styles.monthNavBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="chevron-right" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Mini Calendar Grid */}
        <GlassCard style={styles.calendarCard} intensity="low">
          <View style={styles.weekRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <Text key={d} style={[styles.weekDay, { color: colors.textMuted }]}>{d}</Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const hasBill = billDays.has(day);
              const isToday =
                day === new Date().getDate() &&
                viewMonth === new Date().getMonth() &&
                viewYear === new Date().getFullYear();
              return (
                <View key={day} style={styles.dayCell}>
                  <View
                    style={[
                      styles.dayCircle,
                      isToday && { backgroundColor: colors.primary },
                      hasBill && !isToday && { backgroundColor: `${colors.accent}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: colors.textSecondary },
                        isToday && { color: '#FFF', fontWeight: '700' },
                        hasBill && !isToday && { color: colors.accent, fontWeight: '700' },
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                  {hasBill && <View style={[styles.dayDot, { backgroundColor: colors.accent }]} />}
                </View>
              );
            })}
          </View>
        </GlassCard>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <GlassCard style={styles.summaryCard} glowColor={COLORS.danger} intensity="low">
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Bills Due</Text>
            <Text style={[styles.summaryAmount, { color: colors.danger }]}>
              {formatCurrency(totalExpenses)}
            </Text>
            <Text style={[styles.summaryCount, { color: colors.textMuted }]}>
              {upcomingBills.filter((b) => b.type === 'expense').length} expenses
            </Text>
          </GlassCard>
          <GlassCard style={styles.summaryCard} glowColor={COLORS.success} intensity="low">
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Income Due</Text>
            <Text style={[styles.summaryAmount, { color: colors.success }]}>
              {formatCurrency(totalIncome)}
            </Text>
            <Text style={[styles.summaryCount, { color: colors.textMuted }]}>
              {upcomingBills.filter((b) => b.type === 'income').length} entries
            </Text>
          </GlassCard>
        </View>

        {/* Upcoming List */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Upcoming Bills</Text>
        {grouped.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="event-available" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No bills this month</Text>
          </View>
        ) : (
          grouped.map(([dateStr, bills]) => (
            <View key={dateStr} style={styles.dayGroup}>
              <Text style={[styles.dayGroupTitle, { color: colors.textMuted }]}>
                {new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
              {bills.map((bill) => (
                <View
                  key={bill.id}
                  style={[styles.billItem, { backgroundColor: isDark ? colors.backgroundCard : colors.surface, borderColor: colors.border }]}
                >
                  {bill.type === 'expense' && bill.category ? (
                    <CategoryIcon category={bill.category} size={40} />
                  ) : (
                    <View style={[styles.billIcon, { backgroundColor: `${bill.type === 'income' ? COLORS.success : COLORS.accent}15` }]}>
                      <MaterialIcons
                        name={bill.source ? (INCOME_SOURCE_ICONS[bill.source as keyof typeof INCOME_SOURCE_ICONS] || 'attach-money') as any : 'receipt'}
                        size={20}
                        color={bill.type === 'income' ? COLORS.success : COLORS.accent}
                      />
                    </View>
                  )}
                  <View style={styles.billInfo}>
                    <Text style={[styles.billDesc, { color: colors.textPrimary }]}>{bill.description}</Text>
                    <Text style={[styles.billFreq, { color: colors.textMuted }]}>
                      {FREQUENCY_OPTIONS.find((f) => f.value === bill.frequency)?.label || 'Monthly'}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.billAmount,
                      { color: bill.type === 'income' ? colors.success : colors.danger },
                    ]}
                  >
                    {bill.type === 'income' ? '+' : '-'}{formatCurrency(bill.amount)}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  backBtn: { padding: SPACING.xs, minWidth: 44, minHeight: 44, justifyContent: 'center' as const, alignItems: 'center' as const },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  scrollContent: { padding: SPACING.lg },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  monthLabel: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
  monthNavBtn: { width: 44, height: 44, justifyContent: 'center' as const, alignItems: 'center' as const },
  calendarCard: { marginBottom: SPACING.lg },
  weekRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: { fontSize: FONT_SIZE.sm },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryCard: { flex: 1 },
  summaryLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryAmount: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  summaryCount: { fontSize: FONT_SIZE.xs, marginTop: 4 },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  dayGroup: { marginBottom: SPACING.md },
  dayGroupTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  billItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    gap: SPACING.md,
  },
  billIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  billInfo: { flex: 1 },
  billDesc: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  billFreq: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  billAmount: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyText: { fontSize: FONT_SIZE.md },
});
