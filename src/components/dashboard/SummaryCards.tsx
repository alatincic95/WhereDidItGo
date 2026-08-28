import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';
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
  const { colors, isDark } = useTheme();

  if (viewMode === 'monthly') {
    return (
      <>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={0.7}
          onPress={onEditIncome}
        >
          <View style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(22, 33, 62, 0.85)' : colors.backgroundCard,
              borderColor: isDark ? `${colors.success}25` : colors.border,
            },
          ]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconDot, { backgroundColor: `${colors.success}18` }]}>
                <MaterialIcons name="trending-up" size={16} color={colors.success} />
              </View>
              <Text style={[styles.label, { color: colors.textMuted }]}>Income</Text>
            </View>
            <Text
              style={[styles.amount, { color: colors.success }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatCurrency(totalIncomeThisMonth)}
            </Text>
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              {extraIncome > 0 ? `+${formatCurrency(extraIncome)} extra` : 'Tap to edit base'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(22, 33, 62, 0.85)' : colors.backgroundCard,
              borderColor: isDark ? `${colors.accent}25` : colors.border,
            },
          ]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconDot, { backgroundColor: `${colors.accent}18` }]}>
                <MaterialIcons name="trending-down" size={16} color={colors.accent} />
              </View>
              <Text style={[styles.label, { color: colors.textMuted }]}>Expenses</Text>
            </View>
            <Text
              style={[styles.amount, { color: colors.accent }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatCurrency(totalSpentThisMonth)}
            </Text>
            <Text style={[styles.hint, { color: colors.textMuted }]}>incl. fixed</Text>
          </View>
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
        <View style={[
          styles.card,
          {
            backgroundColor: isDark ? 'rgba(22, 33, 62, 0.85)' : colors.backgroundCard,
            borderColor: isDark ? 'rgba(69, 183, 209, 0.25)' : colors.border,
          },
        ]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconDot, { backgroundColor: 'rgba(69, 183, 209, 0.18)' }]}>
              <MaterialIcons name="savings" size={16} color="#45B7D1" />
            </View>
            <Text style={[styles.label, { color: colors.textMuted }]}>Starting</Text>
          </View>
          <Text
            style={[styles.amount, { color: '#45B7D1' }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {formatCurrency(initialBalance)}
          </Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>Tap to edit</Text>
        </View>
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <View style={[
          styles.card,
          {
            backgroundColor: isDark ? 'rgba(22, 33, 62, 0.85)' : colors.backgroundCard,
            borderColor: isDark ? `${colors.accent}25` : colors.border,
          },
        ]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconDot, { backgroundColor: `${colors.accent}18` }]}>
              <MaterialIcons name="receipt-long" size={16} color={colors.accent} />
            </View>
            <Text style={[styles.label, { color: colors.textMuted }]}>All Time</Text>
          </View>
          <Text
            style={[styles.amount, { color: colors.accent }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {formatCurrency(totalAllTime)}
          </Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>total spent</Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  iconDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  amount: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  hint: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.7,
  },
});
