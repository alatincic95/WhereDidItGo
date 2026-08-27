import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '../GlassCard';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
} from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { Budget } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface BudgetSummaryCardProps {
  activeBudgets: Budget[];
  totalAcrossBudgets: number;
}

export const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({
  activeBudgets,
  totalAcrossBudgets,
}) => {
  const { colors } = useTheme();
  return (
    <GlassCard style={styles.summaryCard} glowColor="#6C63FF" intensity="medium">
      <View style={styles.summaryRow}>
        <View style={[styles.summaryIcon, { backgroundColor: `${colors.primary}18` }]}>
          <MaterialIcons name="account-balance-wallet" size={26} color={colors.primary} />
        </View>
        <View style={styles.summaryInfo}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Active Budgets</Text>
          <Text style={[styles.summaryCount, { color: colors.textPrimary }]}>{activeBudgets.length}</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryInfo}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Total Spent</Text>
          <Text style={[styles.summaryCount, { color: colors.accent }]}>
            {formatCurrency(totalAcrossBudgets)}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    marginBottom: SPACING.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  summaryInfo: {
    flex: 1,
  },
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
});
