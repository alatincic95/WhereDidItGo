import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useTheme } from '../../contexts/ThemeContext';
import { GlassCard } from '../GlassCard';
import { SPACING, FONT_SIZE, BORDER_RADIUS, COLORS } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { calculateSafeToSpend, calculateAgeOfMoney } from '../../utils/safeToSpend';

interface SafeToSpendCardProps {
  currentMonth: string;
}

export const SafeToSpendCard: React.FC<SafeToSpendCardProps> = ({ currentMonth }) => {
  const { colors, isDark } = useTheme();
  const {
    monthlyIncome,
    expenses,
    incomes,
    fixedIncomes,
    getMonthlyTotal,
    getFixedExpensesTotal,
    getFixedIncomesTotal,
    getMonthlyExtraIncome,
    useRecurringAsMonthlyIncome,
    selectedAccountId,
  } = useExpenseStore();

  const monthlySpent = getMonthlyTotal(currentMonth);
  const fixedTotal = getFixedExpensesTotal();
  const fixedIncomeTotal = getFixedIncomesTotal();
  const extraIncome = getMonthlyExtraIncome(currentMonth);

  const safeToSpend = useMemo(
    () => calculateSafeToSpend(
      monthlyIncome, fixedIncomeTotal, extraIncome,
      monthlySpent, fixedTotal, useRecurringAsMonthlyIncome,
    ),
    [monthlyIncome, fixedIncomeTotal, extraIncome, monthlySpent, fixedTotal, useRecurringAsMonthlyIncome],
  );

  const ageOfMoney = useMemo(
    () => calculateAgeOfMoney(incomes, expenses, fixedIncomes, monthlyIncome),
    [incomes, expenses, fixedIncomes, monthlyIncome],
  );

  // Don't show when viewing a specific account or no income configured
  const totalIncome = (useRecurringAsMonthlyIncome ? 0 : monthlyIncome) + fixedIncomeTotal + extraIncome;
  if (selectedAccountId || totalIncome <= 0) return null;

  const isHealthy = safeToSpend.daily > 0;
  const accentColor = isHealthy ? colors.success : colors.danger;

  return (
    <GlassCard style={styles.card} glowColor={isHealthy ? COLORS.success : COLORS.danger} intensity="low">
      <View style={styles.row}>
        {/* Safe to Spend */}
        <View style={styles.mainSection}>
          <View style={styles.labelRow}>
            <View style={[styles.iconCircle, { backgroundColor: `${accentColor}15` }]}>
              <MaterialIcons name="account-balance-wallet" size={18} color={accentColor} />
            </View>
            <Text style={[styles.label, { color: colors.textMuted }]}>SAFE TO SPEND</Text>
          </View>
          <Text
            style={[styles.dailyAmount, { color: accentColor }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {formatCurrency(Math.max(0, safeToSpend.daily))}
            <Text style={[styles.perDay, { color: colors.textMuted }]}>/day</Text>
          </Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            {formatCurrency(safeToSpend.remaining)} left · {safeToSpend.daysLeft} day{safeToSpend.daysLeft !== 1 ? 's' : ''} remaining
          </Text>
        </View>

        {/* Age of Money */}
        {ageOfMoney !== null && (
          <View style={[styles.ageSection, { borderLeftColor: `${colors.textMuted}20` }]}>
            <View style={styles.labelRow}>
              <MaterialIcons name="hourglass-bottom" size={14} color={colors.textMuted} />
              <Text style={[styles.ageLabel, { color: colors.textMuted }]}>AGE OF MONEY</Text>
            </View>
            <Text style={[styles.ageDays, { color: ageOfMoney >= 30 ? colors.success : ageOfMoney >= 14 ? '#FFAA00' : colors.danger }]}>
              {ageOfMoney}
            </Text>
            <Text style={[styles.ageSub, { color: colors.textMuted }]}>days</Text>
            <Text style={[styles.ageHint, { color: colors.textMuted }]}>
              {ageOfMoney >= 30 ? 'Healthy' : ageOfMoney >= 14 ? 'Getting there' : 'Living paycheck to paycheck'}
            </Text>
          </View>
        )}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  mainSection: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.xs },
  iconCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  dailyAmount: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  perDay: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  sub: { fontSize: FONT_SIZE.xs, fontWeight: '500', marginTop: 2 },
  ageSection: { width: 90, alignItems: 'center', borderLeftWidth: 1, paddingLeft: SPACING.sm, marginLeft: SPACING.sm },
  ageLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  ageDays: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  ageSub: { fontSize: 11, fontWeight: '600', marginTop: -2 },
  ageHint: { fontSize: 9, fontWeight: '600', textAlign: 'center', marginTop: 4 },
});
