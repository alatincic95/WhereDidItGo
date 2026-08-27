import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from '../GlassCard';
import { CategoryIcon } from '../CategoryIcon';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';
import { CATEGORY_COLORS, ExpenseCategory, CustomCategory } from '../../types';
import { ViewMode } from './helpers';

interface CategoryBudgetStatus {
  category: string;
  limit: number;
  spent: number;
  percentage: number;
  enabled: boolean;
}

interface TopCategoriesCardProps {
  sortedCategories: [string, number][];
  customCategories: CustomCategory[];
  categoryBudgetMap: Map<string, CategoryBudgetStatus>;
  viewMode: ViewMode;
  formatCurrency: (amount: number) => string;
}

export const TopCategoriesCard: React.FC<TopCategoriesCardProps> = ({
  sortedCategories,
  customCategories,
  categoryBudgetMap,
  viewMode,
  formatCurrency,
}) => {
  const { colors } = useTheme();
  return (
    <GlassCard style={styles.categoriesCard} intensity="low">
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        {viewMode === 'monthly' ? 'Top Categories' : 'All Time Categories'}
      </Text>
      {sortedCategories.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>No expenses yet this month</Text>
      ) : (
        sortedCategories.map(([category, amount]) => {
          const maxAmount = sortedCategories[0][1];
          const customCat = customCategories.find((c) => c.name === category);
          const color = customCat?.color || CATEGORY_COLORS[category as ExpenseCategory] || '#AEB6BF';
          const catBudget = categoryBudgetMap.get(category);
          const barPercentage = catBudget
            ? Math.min(amount / catBudget.limit, 1)
            : amount / maxAmount;
          const barColor = catBudget
            ? catBudget.percentage >= 1
              ? colors.danger
              : catBudget.percentage >= 0.8
              ? colors.warning
              : color
            : color;
          return (
            <View key={category} style={styles.categoryRow}>
              <CategoryIcon category={category} size={36} />
              <View style={styles.categoryInfo}>
                <View style={styles.categoryHeader}>
                  <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{category}</Text>
                  <View style={styles.categoryAmountRow}>
                    <Text style={[styles.categoryAmount, { color: colors.textSecondary }]}>{formatCurrency(amount)}</Text>
                    {catBudget && catBudget.percentage >= 1 && (
                      <View style={styles.overBadge}>
                        <Text style={styles.overBadgeText}>OVER</Text>
                      </View>
                    )}
                  </View>
                </View>
                {catBudget && (
                  <Text style={[styles.categoryLimitText, { color: colors.textMuted }]}>
                    of {formatCurrency(catBudget.limit)}
                  </Text>
                )}
                <View style={[styles.categoryBar, { backgroundColor: `${colors.textMuted}15` }]}>
                  <View
                    style={[
                      styles.categoryBarFill,
                      { width: `${barPercentage * 100}%`, backgroundColor: barColor },
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  categoriesCard: { marginBottom: SPACING.lg },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: SPACING.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  categoryInfo: { flex: 1 },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: { fontSize: FONT_SIZE.md, color: COLORS.textPrimary, fontWeight: '600' },
  categoryAmount: { fontSize: FONT_SIZE.md, color: COLORS.textSecondary, fontWeight: '600' },
  categoryAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryLimitText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: 4,
  },
  overBadge: {
    backgroundColor: 'rgba(255, 61, 113, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  overBadgeText: {
    fontSize: 9,
    color: COLORS.danger,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  categoryBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryBarFill: { height: '100%', borderRadius: 2 },
});
