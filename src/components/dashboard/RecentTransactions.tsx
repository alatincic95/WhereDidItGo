import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CategoryIcon } from '../CategoryIcon';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';
import { INCOME_SOURCE_COLORS, INCOME_SOURCE_ICONS, IncomeSource } from '../../types';
import { formatCurrencyWithCode } from '../../utils/currency';
import { formatDate } from './helpers';

interface Transaction {
  id: string;
  amount: number;
  description?: string;
  date: string;
  type: 'expense' | 'income';
  category?: string;
  source?: string;
  currency?: string;
}

interface RecentTransactionsProps {
  recentTransactions: Transaction[];
  navigation: any;
  formatCurrency: (amount: number) => string;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  recentTransactions,
  navigation,
  formatCurrency,
}) => {
  const { colors } = useTheme();
  return (
    <>
      <View style={styles.recentHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      {recentTransactions.map((transaction) => (
        <TouchableOpacity
          key={transaction.id}
          style={[styles.transactionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          {transaction.type === 'expense' ? (
            <CategoryIcon category={(transaction as any).category} size={44} />
          ) : (
            <View style={[styles.incomeIconWrap, { backgroundColor: `${INCOME_SOURCE_COLORS[(transaction as any).source as IncomeSource] || '#00D68F'}20` }]}>
              <MaterialIcons
                name={(INCOME_SOURCE_ICONS[(transaction as any).source as IncomeSource] || 'attach-money') as any}
                size={22}
                color={INCOME_SOURCE_COLORS[(transaction as any).source as IncomeSource] || '#00D68F'}
              />
            </View>
          )}
          <View style={styles.transactionInfo}>
            <Text style={[styles.transactionDesc, { color: colors.textPrimary }]}>
              {transaction.description || (transaction.type === 'expense' ? (transaction as any).category : (transaction as any).source)}
            </Text>
            <Text style={[styles.transactionDate, { color: colors.textMuted }]}>{formatDate(transaction.date)}</Text>
          </View>
          <Text style={[
            styles.transactionAmount,
            { color: colors.accent },
            transaction.type === 'income' && { color: colors.success },
          ]}>
            {transaction.type === 'expense' ? '-' : '+'}
            {transaction.type === 'expense' && (transaction as any).currency
              ? formatCurrencyWithCode(transaction.amount, (transaction as any).currency)
              : formatCurrency(transaction.amount)}
          </Text>
        </TouchableOpacity>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  recentHeader: {
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
  seeAllText: { fontSize: FONT_SIZE.md, color: COLORS.primary, fontWeight: '600' },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 33, 62, 0.6)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.08)',
    gap: SPACING.md,
  },
  transactionInfo: { flex: 1 },
  transactionDesc: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDate: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, fontWeight: '500' },
  transactionAmount: { fontSize: FONT_SIZE.lg, color: COLORS.accent, fontWeight: '700' },
  incomeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
