import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '../GlassCard';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, SPACING, FONT_SIZE } from '../../constants/theme';
import { ViewMode } from './helpers';

interface SummaryCardsProps {
  viewMode: ViewMode;
  totalIncomeThisMonth: number;
  extraIncome: number;
  totalSpentThisMonth: number;
  initialBalance: number;
  totalAllTime: number;
  formatCurrency: (amount: number) => string;
  onEditIncome: () => void;
  onEditInitialBalance: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  viewMode,
  totalIncomeThisMonth,
  extraIncome,
  totalSpentThisMonth,
  initialBalance,
  totalAllTime,
  formatCurrency,
  onEditIncome,
  onEditInitialBalance,
}) => {
  const { colors } = useTheme();

  if (viewMode === 'monthly') {
    return (
      <>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={0.7}
          onPress={onEditIncome}
        >
          <GlassCard style={styles.summaryCard} glowColor={colors.success} intensity="low">
            <View style={styles.summaryCardIcon}>
              <MaterialIcons name="attach-money" size={20} color={colors.success} />
            </View>
            <Text style={[styles.summaryCardLabel, { color: colors.textMuted }]}>Income</Text>
            <Text style={[styles.summaryCardAmount, { color: colors.success }]}>
              {formatCurrency(totalIncomeThisMonth)}
            </Text>
            {extraIncome > 0 ? (
              <Text style={[styles.summaryCardHint, { color: colors.textMuted }]}>+{formatCurrency(extraIncome)} extra</Text>
            ) : (
              <Text style={[styles.summaryCardHint, { color: colors.textMuted }]}>Tap to edit base</Text>
            )}
          </GlassCard>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <GlassCard style={styles.summaryCard} glowColor={colors.accent} intensity="low">
            <View style={[styles.summaryCardIcon, { backgroundColor: `${colors.accent}1F` }]}>
              <MaterialIcons name="shopping-cart" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.summaryCardLabel, { color: colors.textMuted }]}>Expenses</Text>
            <Text style={[styles.summaryCardAmount, { color: colors.accent }]}>
              {formatCurrency(totalSpentThisMonth)}
            </Text>
            <Text style={[styles.summaryCardHint, { color: colors.textMuted }]}>incl. fixed</Text>
          </GlassCard>
        </View>
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={{ flex: 1 }}
        activeOpacity={0.7}
        onPress={onEditInitialBalance}
      >
        <GlassCard style={styles.summaryCard} glowColor="#45B7D1" intensity="low">
          <View style={[styles.summaryCardIcon, { backgroundColor: 'rgba(69, 183, 209, 0.12)' }]}>
            <MaterialIcons name="savings" size={20} color="#45B7D1" />
          </View>
          <Text style={[styles.summaryCardLabel, { color: colors.textMuted }]}>Starting</Text>
          <Text style={[styles.summaryCardAmount, { color: '#45B7D1' }]}>
            {formatCurrency(initialBalance)}
          </Text>
          <Text style={[styles.summaryCardHint, { color: colors.textMuted }]}>Tap to edit</Text>
        </GlassCard>
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <GlassCard style={styles.summaryCard} glowColor={colors.accent} intensity="low">
          <View style={[styles.summaryCardIcon, { backgroundColor: `${colors.accent}1F` }]}>
            <MaterialIcons name="receipt-long" size={20} color={colors.accent} />
          </View>
          <Text style={[styles.summaryCardLabel, { color: colors.textMuted }]}>All Time</Text>
          <Text style={[styles.summaryCardAmount, { color: colors.accent }]}>
            {formatCurrency(totalAllTime)}
          </Text>
          <Text style={[styles.summaryCardHint, { color: colors.textMuted }]}>total spent</Text>
        </GlassCard>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    flex: 1,
    padding: SPACING.md,
  },
  summaryCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 214, 143, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryCardLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryCardAmount: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  summaryCardHint: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.7,
  },
});
