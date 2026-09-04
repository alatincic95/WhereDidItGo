import React, { useState } from 'react';
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
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.recentHeader}
        activeOpacity={0.7}
        onPress={() => setExpanded(!expanded)}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Recent Transactions
          </Text>
          {!expanded && (
            <View style={[styles.countBadge, { backgroundColor: `${colors.primary}20` }]}>
              <Text style={[styles.countText, { color: colors.primary }]}>
                {recentTransactions.length}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
          <MaterialIcons
            name={expanded ? 'expand-less' : 'expand-more'}
            size={24}
            color={colors.textMuted}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.transactionsList}>
          {recentTransactions.map((transaction, index) => (
            <TouchableOpacity
              key={transaction.id}
              style={[
                styles.transactionItem,
                index < recentTransactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
              activeOpacity={0.7}
            >
              {transaction.type === 'expense' ? (
                <CategoryIcon category={(transaction as any).category} size={40} />
              ) : (
                <View style={[styles.incomeIconWrap, { backgroundColor: `${INCOME_SOURCE_COLORS[(transaction as any).source as IncomeSource] || '#00D68F'}20` }]}>
                  <MaterialIcons
                    name={(INCOME_SOURCE_ICONS[(transaction as any).source as IncomeSource] || 'attach-money') as any}
                    size={20}
                    color={INCOME_SOURCE_COLORS[(transaction as any).source as IncomeSource] || '#00D68F'}
                  />
                </View>
              )}
              <View style={styles.transactionInfo}>
                <Text style={[styles.transactionDesc, { color: colors.textPrimary }]} numberOfLines={1}>
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
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  seeAllText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600' },
  transactionsList: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
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
  transactionAmount: { fontSize: FONT_SIZE.md, color: COLORS.accent, fontWeight: '700' },
  incomeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
