import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../GlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, SPACING, FONT_SIZE } from '../../constants/theme';

interface BudgetUsageCardProps {
  spendingPercentage: number;
  monthlyBalance: number;
  totalIncomeThisMonth: number;
  formatCurrency: (amount: number) => string;
}

export const BudgetUsageCard: React.FC<BudgetUsageCardProps> = ({
  spendingPercentage,
  monthlyBalance,
  totalIncomeThisMonth,
  formatCurrency,
}) => {
  const { colors } = useTheme();
  return (
    <GlassCard style={styles.spendingCard} glowColor={COLORS.primary} intensity="low">
      <View style={styles.spendingHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Budget Usage</Text>
        <Text style={[
          styles.spendingPercent,
          spendingPercentage > 1 && { color: colors.danger },
        ]}>
          {Math.round(spendingPercentage * 100)}%
        </Text>
      </View>
      <View style={[styles.progressBar, { backgroundColor: `${colors.primary}15` }]}>
        <LinearGradient
          colors={
            spendingPercentage > 0.9
              ? ['#FF3D71', '#FF6B8A']
              : spendingPercentage > 0.7
              ? ['#FFAA00', '#FFBB33']
              : ['#6C63FF', '#BB8FCE']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.progressFill,
            { width: `${Math.min(spendingPercentage * 100, 100)}%` },
          ]}
        />
      </View>
      <View style={styles.spendingFooter}>
        <Text style={[styles.spendingSubtext, { color: colors.textMuted }]}>
          {monthlyBalance >= 0
            ? `${formatCurrency(monthlyBalance)} remaining`
            : `${formatCurrency(Math.abs(monthlyBalance))} over budget`}
        </Text>
        <Text style={[styles.spendingSubtext, { color: colors.textMuted }]}>
          of {formatCurrency(totalIncomeThisMonth)}
        </Text>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  spendingCard: { marginBottom: SPACING.lg },
  spendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  spendingPercent: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.primary,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  spendingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spendingSubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
