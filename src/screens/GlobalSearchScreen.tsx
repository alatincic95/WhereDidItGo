import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useExpenseStore } from '../store/useExpenseStore';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { CategoryIcon } from '../components/CategoryIcon';
import { formatCurrency } from '../utils/currency';
import {
  INCOME_SOURCE_ICONS,
  INCOME_SOURCE_COLORS,
  IncomeSource,
} from '../types';

type ResultType = 'expense' | 'income' | 'budget' | 'recurring_expense' | 'recurring_income' | 'savings_goal';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  amount?: number;
  icon: string;
  iconColor: string;
  date?: string;
  category?: string;
}

const TYPE_LABELS: Record<ResultType, string> = {
  expense: 'Expense',
  income: 'Income',
  budget: 'Budget',
  recurring_expense: 'Recurring Expense',
  recurring_income: 'Recurring Income',
  savings_goal: 'Savings Goal',
};

const TYPE_ICONS: Record<ResultType, string> = {
  expense: 'receipt-long',
  income: 'account-balance',
  budget: 'account-balance-wallet',
  recurring_expense: 'autorenew',
  recurring_income: 'autorenew',
  savings_goal: 'savings',
};

export const GlobalSearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ResultType | 'all'>('all');

  const {
    expenses,
    incomes,
    budgets,
    fixedExpenses,
    fixedIncomes,
    savingsGoals,
    customCategories,
    currencySymbol,
  } = useExpenseStore();

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const allResults = useMemo((): SearchResult[] => {
    const q = query.toLowerCase().trim();
    if (q.length === 0) return [];

    const results: SearchResult[] = [];

    // Search expenses
    expenses.forEach((e) => {
      if (
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.tags && e.tags.some((t) => t.toLowerCase().includes(q)))
      ) {
        results.push({
          id: `expense-${e.id}`,
          type: 'expense',
          title: e.description || e.category,
          subtitle: e.category,
          amount: -e.amount,
          icon: 'receipt-long',
          iconColor: COLORS.danger,
          date: e.date,
          category: e.category,
        });
      }
    });

    // Search incomes
    incomes.forEach((i) => {
      if (
        i.description.toLowerCase().includes(q) ||
        i.source.toLowerCase().includes(q)
      ) {
        results.push({
          id: `income-${i.id}`,
          type: 'income',
          title: i.description || i.source,
          subtitle: i.source,
          amount: i.amount,
          icon: INCOME_SOURCE_ICONS[i.source as IncomeSource] || 'more-horiz',
          iconColor: INCOME_SOURCE_COLORS[i.source as IncomeSource] || COLORS.success,
          date: i.date,
        });
      }
    });

    // Search budgets
    budgets.forEach((b) => {
      if (
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
      ) {
        results.push({
          id: `budget-${b.id}`,
          type: 'budget',
          title: b.name,
          subtitle: b.description || 'Budget',
          amount: b.budget,
          icon: 'account-balance-wallet',
          iconColor: b.color,
        });
      }
    });

    // Search recurring expenses
    fixedExpenses.forEach((fe) => {
      if (
        fe.description.toLowerCase().includes(q) ||
        fe.category.toLowerCase().includes(q)
      ) {
        results.push({
          id: `recurring-expense-${fe.id}`,
          type: 'recurring_expense',
          title: fe.description || fe.category,
          subtitle: `${fe.category} · ${fe.frequency || 'monthly'}`,
          amount: -fe.amount,
          icon: 'autorenew',
          iconColor: COLORS.warning,
          category: fe.category,
        });
      }
    });

    // Search recurring incomes
    fixedIncomes.forEach((fi) => {
      if (
        fi.description.toLowerCase().includes(q) ||
        fi.source.toLowerCase().includes(q)
      ) {
        results.push({
          id: `recurring-income-${fi.id}`,
          type: 'recurring_income',
          title: fi.description || fi.source,
          subtitle: `${fi.source} · ${fi.frequency || 'monthly'}`,
          amount: fi.amount,
          icon: 'autorenew',
          iconColor: COLORS.success,
        });
      }
    });

    // Search savings goals
    savingsGoals.forEach((g) => {
      if (g.name.toLowerCase().includes(q)) {
        results.push({
          id: `goal-${g.id}`,
          type: 'savings_goal',
          title: g.name,
          subtitle: `${formatCurrency(g.currentAmount)} / ${formatCurrency(g.targetAmount)}`,
          amount: g.targetAmount,
          icon: g.icon || 'savings',
          iconColor: g.color,
        });
      }
    });

    // Sort by date (most recent first), items without date go last
    results.sort((a, b) => {
      if (a.date && b.date) return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (a.date) return -1;
      if (b.date) return 1;
      return 0;
    });

    return results;
  }, [query, expenses, incomes, budgets, fixedExpenses, fixedIncomes, savingsGoals]);

  const filteredResults = useMemo(() => {
    if (activeFilter === 'all') return allResults;
    return allResults.filter((r) => r.type === activeFilter);
  }, [allResults, activeFilter]);

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<ResultType, number>> = {};
    allResults.forEach((r) => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });
    return counts;
  }, [allResults]);

  const handleResultPress = (result: SearchResult) => {
    Keyboard.dismiss();
    const rawId = result.id.replace(/^(expense|income|budget|recurring-expense|recurring-income|goal)-/, '');
    switch (result.type) {
      case 'expense':
        navigation.navigate('AddExpense', { expenseId: rawId });
        break;
      case 'income':
        navigation.navigate('AddIncome', { incomeId: rawId });
        break;
      case 'budget':
        navigation.navigate('BudgetDetail', { budgetId: rawId });
        break;
      case 'savings_goal':
        navigation.navigate('SavingsGoals');
        break;
      case 'recurring_expense':
      case 'recurring_income':
        navigation.navigate('Main', { screen: 'Fixed' });
        break;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={[styles.resultCard, { backgroundColor: isDark ? colors.backgroundCard : colors.surface }]}
      onPress={() => handleResultPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.resultIcon, { backgroundColor: `${item.iconColor}20` }]}>
        {item.category ? (
          <CategoryIcon category={item.category} size={22} />
        ) : (
          <MaterialIcons name={item.icon as any} size={22} color={item.iconColor} />
        )}
      </View>
      <View style={styles.resultContent}>
        <Text style={[styles.resultTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.resultMeta}>
          <View style={[styles.typeBadge, { backgroundColor: `${item.iconColor}15` }]}>
            <Text style={[styles.typeBadgeText, { color: item.iconColor }]}>
              {TYPE_LABELS[item.type]}
            </Text>
          </View>
          {item.date && (
            <Text style={[styles.resultDate, { color: colors.textMuted }]}>
              {formatDate(item.date)}
            </Text>
          )}
        </View>
      </View>
      {item.amount !== undefined && (
        <Text
          style={[
            styles.resultAmount,
            { color: item.amount >= 0 ? colors.success : colors.danger },
          ]}
        >
          {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
        </Text>
      )}
    </TouchableOpacity>
  );

  const filterTypes: (ResultType | 'all')[] = ['all', 'expense', 'income', 'budget', 'recurring_expense', 'recurring_income', 'savings_goal'];
  const activeFilterTypes = filterTypes.filter(
    (t) => t === 'all' || (typeCounts[t as ResultType] || 0) > 0
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={[styles.searchBar, { backgroundColor: isDark ? colors.backgroundCard : colors.surfaceLight }]}>
          <MaterialIcons name="search" size={20} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search expenses, income, budgets, goals..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <MaterialIcons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips */}
      {allResults.length > 0 && (
        <View style={styles.filterRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={activeFilterTypes}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.filterContent}
            renderItem={({ item: filterType }) => {
              const isActive = activeFilter === filterType;
              const count = filterType === 'all' ? allResults.length : (typeCounts[filterType as ResultType] || 0);
              return (
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isActive ? colors.primary : (isDark ? colors.backgroundCard : colors.surfaceLight),
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setActiveFilter(filterType)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isActive ? '#FFF' : colors.textSecondary },
                    ]}
                  >
                    {filterType === 'all' ? 'All' : TYPE_LABELS[filterType as ResultType]} ({count})
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* Results */}
      {query.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="search" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            Search everything
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Find expenses, income, budgets, recurring items, and savings goals
          </Text>
        </View>
      ) : filteredResults.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="search-off" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            No results found
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Try a different search term
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredResults}
          keyExtractor={(item) => item.id}
          renderItem={renderResult}
          contentContainerStyle={styles.resultsList}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.sm,
  },
  backButton: {
    padding: SPACING.xs,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    paddingVertical: 4,
  },
  filterRow: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0,
  },
  filterContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  resultsList: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    flex: 1,
    gap: 4,
  },
  resultTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  typeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  typeBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultDate: {
    fontSize: FONT_SIZE.sm,
  },
  resultAmount: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    lineHeight: 20,
  },
});
