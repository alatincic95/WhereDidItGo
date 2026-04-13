import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CategoryIcon } from '../components/CategoryIcon';
import { useExpenseStore } from '../store/useExpenseStore';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import {
  Expense,
  EXPENSE_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  ExpenseCategory,
} from '../types';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

import { formatCurrency, formatCurrencyWithCode } from '../utils/currency';

const groupExpensesByDate = (expenses: Expense[]) => {
  const groups: Record<string, Expense[]> = {};
  expenses.forEach((expense) => {
    const date = new Date(expense.date).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(expense);
  });
  return Object.entries(groups).sort(
    ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
  );
};

const formatGroupDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

type SortMode = 'date' | 'amount_high' | 'amount_low';

export const ExpenseListScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const { expenses, fixedExpenses, getMonthlyExpenses, deleteExpense, getMonthlyTotal, getFixedExpensesTotal, currencySymbol, customCategories, getOrderedCategories } = useExpenseStore();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth());
  const [selectedYear] = useState(new Date().getFullYear());
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [searchText, setSearchText] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const isAllMonths = selectedMonth === null;
  const monthKey = isAllMonths ? '' : `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  // Convert fixed expenses to regular expense shape with a "Recurring" marker
  const fixedAsExpenses: Expense[] = fixedExpenses.map((f) => ({
    id: `fixed-${f.id}`,
    amount: f.amount,
    category: f.category,
    description: `${f.description} (recurring)`,
    date: isAllMonths
      ? new Date(selectedYear, new Date().getMonth(), 1).toISOString()
      : new Date(selectedYear, selectedMonth!, 1).toISOString(),
    isFixed: true,
  }));

  const baseExpenses = isAllMonths
    ? [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : getMonthlyExpenses(monthKey);

  const monthlyExpenses = [...baseExpenses, ...fixedAsExpenses];

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedCategories(new Set());
    setMinAmount('');
    setMaxAmount('');
    setSortMode('date');
    setSearchText('');
  };

  const hasActiveFilters = selectedCategories.size > 0 || minAmount !== '' || maxAmount !== '' || sortMode !== 'date' || searchText !== '';

  const filteredExpenses = useMemo(() => {
    let result = [...monthlyExpenses];

    // Search
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategories.size > 0) {
      result = result.filter((e) => selectedCategories.has(e.category));
    }

    // Amount range
    const min = parseFloat(minAmount);
    const max = parseFloat(maxAmount);
    if (!isNaN(min)) result = result.filter((e) => e.amount >= min);
    if (!isNaN(max)) result = result.filter((e) => e.amount <= max);

    // Sort
    if (sortMode === 'amount_high') {
      result.sort((a, b) => b.amount - a.amount);
    } else if (sortMode === 'amount_low') {
      result.sort((a, b) => a.amount - b.amount);
    } else {
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return result;
  }, [monthlyExpenses, selectedCategories, minAmount, maxAmount, sortMode, searchText]);

  const filteredTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const fixedTotal = getFixedExpensesTotal();
  const monthlyTotal = isAllMonths
    ? expenses.reduce((s, e) => s + e.amount, 0) + fixedTotal
    : getMonthlyTotal(monthKey) + fixedTotal;
  const grouped = groupExpensesByDate(filteredExpenses);

  const renderExpenseItem = (expense: Expense) => (
    <TouchableOpacity
      key={expense.id}
      style={styles.expenseItem}
      activeOpacity={0.7}
      onPress={() => {
        if (expense.id.startsWith('fixed-')) return; // recurring items managed in Fixed tab
        navigation.navigate('AddExpense', { expense });
      }}
    >
      <CategoryIcon category={expense.category} size={44} />
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseDesc}>
          {expense.description || expense.category}
        </Text>
        <View style={styles.expenseMeta}>
          <Text style={styles.expenseCategory}>{expense.category}</Text>
          {expense.isFixed && (
            <View style={styles.recurringBadge}>
              <MaterialIcons name="autorenew" size={10} color={COLORS.primary} />
            </View>
          )}
          {expense.receiptUri && (
            <View style={styles.recurringBadge}>
              <MaterialIcons name="receipt" size={10} color={COLORS.success} />
            </View>
          )}
        </View>
      </View>
      <View style={styles.expenseRight}>
        <Text style={styles.expenseAmount}>
          -{expense.currency ? formatCurrencyWithCode(expense.amount, expense.currency) : formatCurrency(expense.amount)}
        </Text>
        <Text style={styles.expenseTime}>
          {new Date(expense.date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expenses</Text>
        <View style={styles.headerTotal}>
          <Text style={styles.headerTotalLabel}>
            {hasActiveFilters ? 'Filtered' : isAllMonths ? 'All time' : 'This month'}
          </Text>
          <Text style={styles.headerTotalAmount}>
            {formatCurrency(hasActiveFilters ? filteredTotal : monthlyTotal)}
          </Text>
        </View>
      </View>

      {/* Search + Filter Row */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search expenses..."
            placeholderTextColor={COLORS.textMuted}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText !== '' && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
          onPress={() => setFilterOpen(true)}
        >
          <MaterialIcons
            name="tune"
            size={22}
            color={hasActiveFilters ? '#FFF' : COLORS.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <View style={styles.chipRow}>
          {selectedCategories.size > 0 && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {selectedCategories.size} {selectedCategories.size === 1 ? 'category' : 'categories'}
              </Text>
            </View>
          )}
          {minAmount !== '' && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>Min: ${minAmount}</Text>
            </View>
          )}
          {maxAmount !== '' && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>Max: ${maxAmount}</Text>
            </View>
          )}
          {sortMode !== 'date' && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {sortMode === 'amount_high' ? 'Highest first' : 'Lowest first'}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.chipClear} onPress={clearFilters}>
            <MaterialIcons name="close" size={12} color={COLORS.danger} />
            <Text style={[styles.chipText, { color: COLORS.danger }]}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', ...MONTHS]}
          contentContainerStyle={styles.monthList}
          initialScrollIndex={selectedMonth === null ? 0 : Math.min(selectedMonth + 1, 12)}
          getItemLayout={(_, index) => ({
            length: 64,
            offset: 64 * index,
            index,
          })}
          renderItem={({ item, index }) => {
            const monthIndex = index === 0 ? null : index - 1;
            const isSelected = selectedMonth === monthIndex;
            return (
              <TouchableOpacity
                style={[styles.monthItem, isSelected && styles.monthItemActive]}
                onPress={() => setSelectedMonth(monthIndex)}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={['#6C63FF', '#BB8FCE']}
                    style={styles.monthGradient}
                  >
                    <Text style={[styles.monthText, styles.monthTextActive]}>
                      {item}
                    </Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.monthText}>{item}</Text>
                )}
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => item}
        />
      </View>

      {/* Expense List */}
      <Animated.ScrollView
        style={[styles.list, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialIcons
                name={hasActiveFilters ? 'filter-list-off' : 'receipt-long'}
                size={48}
                color={COLORS.textMuted}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {hasActiveFilters ? 'No matches' : 'No expenses yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Tap the + button to add your first expense'}
            </Text>
          </View>
        ) : sortMode !== 'date' ? (
          filteredExpenses.map(renderExpenseItem)
        ) : (
          grouped.map(([date, items]) => (
            <View key={date} style={styles.dateGroup}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateText}>{formatGroupDate(date)}</Text>
                <Text style={styles.dateTotalText}>
                  {formatCurrency(items.reduce((s, e) => s + e.amount, 0))}
                </Text>
              </View>
              {items.map(renderExpenseItem)}
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={filterOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFilterOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setFilterOpen(false)}>
              <Text style={styles.modalCancel}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => { clearFilters(); setFilterOpen(false); }}>
              <Text style={styles.modalReset}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Sort */}
            <Text style={styles.modalLabel}>Sort By</Text>
            <View style={styles.sortRow}>
              {([
                ['date', 'Date', 'schedule'],
                ['amount_high', 'Highest', 'arrow-upward'],
                ['amount_low', 'Lowest', 'arrow-downward'],
              ] as [SortMode, string, string][]).map(([mode, label, icon]) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.sortOption, sortMode === mode && styles.sortOptionActive]}
                  onPress={() => setSortMode(mode)}
                >
                  <MaterialIcons
                    name={icon as any}
                    size={18}
                    color={sortMode === mode ? '#FFF' : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortMode === mode && styles.sortOptionTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category */}
            <Text style={styles.modalLabel}>Categories</Text>
            <View style={styles.categoryGrid}>
              {EXPENSE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.has(cat);
                const color = CATEGORY_COLORS[cat];
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      isSelected && { borderColor: color, backgroundColor: `${color}18` },
                    ]}
                    onPress={() => toggleCategory(cat)}
                  >
                    <MaterialIcons
                      name={CATEGORY_ICONS[cat] as any}
                      size={16}
                      color={isSelected ? color : COLORS.textMuted}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && { color },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {customCategories.map((cc) => {
                const isSelected = selectedCategories.has(cc.name);
                return (
                  <TouchableOpacity
                    key={cc.name}
                    style={[
                      styles.categoryChip,
                      isSelected && { borderColor: cc.color, backgroundColor: `${cc.color}18` },
                    ]}
                    onPress={() => toggleCategory(cc.name)}
                  >
                    <MaterialIcons
                      name={cc.icon as any}
                      size={16}
                      color={isSelected ? cc.color : COLORS.textMuted}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && { color: cc.color },
                      ]}
                    >
                      {cc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Amount Range */}
            <Text style={styles.modalLabel}>Amount Range</Text>
            <View style={styles.amountRow}>
              <View style={styles.amountInputWrap}>
                <Text style={styles.amountPrefix}>{currencySymbol}</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Min"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                  value={minAmount}
                  onChangeText={setMinAmount}
                />
              </View>
              <Text style={styles.amountDash}>—</Text>
              <View style={styles.amountInputWrap}>
                <Text style={styles.amountPrefix}>{currencySymbol}</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Max"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                  value={maxAmount}
                  onChangeText={setMaxAmount}
                />
              </View>
            </View>

            {/* Apply */}
            <TouchableOpacity
              style={styles.applyBtn}
              activeOpacity={0.8}
              onPress={() => setFilterOpen(false)}
            >
              <LinearGradient
                colors={['#6C63FF', '#9B59B6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.applyBtnGradient}
              >
                <Text style={styles.applyBtnText}>
                  Show Results ({filteredExpenses.length})
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AddExpense')}
      >
        <LinearGradient
          colors={['#6C63FF', '#BB8FCE']}
          style={styles.fabGradient}
        >
          <MaterialIcons name="add" size={28} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    color: COLORS.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerTotal: {
    alignItems: 'flex-end',
  },
  headerTotalLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTotalAmount: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.accent,
    fontWeight: '800',
  },

  // Search + Filter
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  // Filter Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xs,
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
  },
  chipText: {
    fontSize: 10,
    color: COLORS.primaryLight,
    fontWeight: '600',
  },
  chipClear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(255, 61, 113, 0.12)',
  },

  // Month Selector
  monthSelector: {
    marginVertical: SPACING.sm,
  },
  monthList: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  monthItem: {
    width: 56,
    height: 36,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  monthItemActive: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  monthGradient: {
    width: 56,
    height: 36,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  monthTextActive: {
    color: '#FFFFFF',
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
  },
  dateGroup: {
    marginBottom: SPACING.lg,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(108, 99, 255, 0.08)',
  },
  dateText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dateTotalText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 33, 62, 0.6)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.06)',
    gap: SPACING.md,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDesc: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expenseCategory: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  recurringBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.accent,
    fontWeight: '700',
    marginBottom: 2,
  },
  expenseTime: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Filter Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCancel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  modalReset: {
    fontSize: FONT_SIZE.md,
    color: COLORS.danger,
    fontWeight: '600',
  },
  modalContent: {
    padding: SPACING.lg,
  },
  modalLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },

  // Sort
  sortRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  sortOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortOptionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  sortOptionTextActive: {
    color: '#FFF',
  },

  // Category Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 6,
  },
  categoryChipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },

  // Amount Range
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  amountInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 48,
  },
  amountPrefix: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.primary,
    fontWeight: '700',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  amountDash: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  // Apply Button
  applyBtn: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginTop: SPACING.xl,
  },
  applyBtnGradient: {
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
  },
  applyBtnText: {
    fontSize: FONT_SIZE.lg,
    color: '#FFF',
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 96,
    right: SPACING.lg,
    borderRadius: 29,
  },
  fabGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
