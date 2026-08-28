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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryIcon } from '../components/CategoryIcon';
import { useExpenseStore } from '../store/useExpenseStore';
import { useUndoStore } from '../store/useUndoStore';
import { CalendarPicker } from '../components/CalendarPicker';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import {
  Expense,
  EXPENSE_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  ExpenseCategory,
} from '../types';
import { exportCsv } from '../utils/exportData';

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
  const insets = useSafeAreaInsets();
  const { expenses, fixedExpenses, incomes, fixedIncomes, getMonthlyExpenses, deleteExpense, updateExpense, addExpenseWithId, getMonthlyTotal, getFixedExpensesTotal, currencySymbol, customCategories, getOrderedCategories } = useExpenseStore();
  const showUndo = useUndoStore((s) => s.show);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth());
  const [selectedYear] = useState(new Date().getFullYear());
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [searchText, setSearchText] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);
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

  // Auto-generated recurring entries now exist as real Expense objects (isFixed: true)
  const monthlyExpenses = isAllMonths
    ? [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : getMonthlyExpenses(monthKey);

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
    setDateFrom('');
    setDateTo('');
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    const snapshots = expenses.filter((e) => selectedIds.has(e.id));
    snapshots.forEach((e) => deleteExpense(e.id));
    showUndo({
      message: `${snapshots.length} expense${snapshots.length > 1 ? 's' : ''} deleted`,
      entityType: 'expense',
      restore: () => snapshots.forEach((e) => addExpenseWithId(e)),
    });
    exitSelectionMode();
    setShowBulkDeleteConfirm(false);
  };

  const handleBulkRecategorize = (newCategory: string) => {
    const snapshots = expenses.filter((e) => selectedIds.has(e.id)).map((e) => ({ ...e }));
    snapshots.forEach((e) => updateExpense(e.id, { category: newCategory }));
    showUndo({
      message: `${snapshots.length} expense${snapshots.length > 1 ? 's' : ''} moved to ${newCategory}`,
      entityType: 'expense',
      restore: () => snapshots.forEach((e) => updateExpense(e.id, { category: e.category })),
    });
    exitSelectionMode();
    setShowBulkCategoryModal(false);
  };

  const hasActiveFilters = selectedCategories.size > 0 || minAmount !== '' || maxAmount !== '' || sortMode !== 'date' || searchText !== '' || dateFrom !== '' || dateTo !== '';

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

    // Date range filter
    if (dateFrom) {
      const from = new Date(dateFrom + 'T00:00:00');
      if (!isNaN(from.getTime())) result = result.filter((e) => new Date(e.date) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59');
      if (!isNaN(to.getTime())) result = result.filter((e) => new Date(e.date) <= to);
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
  }, [monthlyExpenses, selectedCategories, minAmount, maxAmount, sortMode, searchText, dateFrom, dateTo]);

  const filteredTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const fixedTotal = getFixedExpensesTotal();
  const monthlyTotal = isAllMonths
    ? expenses.reduce((s, e) => s + e.amount, 0) + fixedTotal
    : getMonthlyTotal(monthKey) + fixedTotal;
  const grouped = groupExpensesByDate(filteredExpenses);

  const renderExpenseItem = (expense: Expense) => {
    const isSelected = selectedIds.has(expense.id);
    return (
    <TouchableOpacity
      key={expense.id}
      style={[
        styles.expenseItem,
        { backgroundColor: colors.surface, borderColor: colors.border },
        isSelected && { borderColor: colors.primary, backgroundColor: `${colors.primary}12` },
      ]}
      activeOpacity={0.7}
      onPress={() => {
        if (selectionMode) {
          toggleSelection(expense.id);
          return;
        }
        if (expense.isFixed) {
          navigation.navigate('Main', { screen: 'Fixed' });
          return;
        }
        navigation.navigate('AddExpense', { expense });
      }}
      onLongPress={() => {
        if (expense.isFixed) return;
        if (!selectionMode) {
          setSelectionMode(true);
          setSelectedIds(new Set([expense.id]));
        }
      }}
    >
      {selectionMode && (
        <View style={[styles.selectionCheck, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          {isSelected && <MaterialIcons name="check" size={14} color="#FFF" />}
        </View>
      )}
      <CategoryIcon category={expense.category} size={44} />
      <View style={styles.expenseInfo}>
        <Text style={[styles.expenseDesc, { color: colors.textPrimary }]}>
          {expense.description || expense.category}
        </Text>
        <View style={styles.expenseMeta}>
          <Text style={[styles.expenseCategory, { color: colors.textMuted }]}>{expense.category}</Text>
          {expense.isFixed && (
            <View style={[styles.recurringBadge, { backgroundColor: `${colors.primary}20` }]}>
              <MaterialIcons name="autorenew" size={10} color={colors.primary} />
            </View>
          )}
          {expense.receiptUri && (
            <View style={[styles.recurringBadge, { backgroundColor: `${colors.primary}20` }]}>
              <MaterialIcons name="receipt" size={10} color={COLORS.success} />
            </View>
          )}
          {expense.splits && expense.splits.length > 0 && (
            <View style={[styles.recurringBadge, { backgroundColor: `${colors.primary}20` }]}>
              <MaterialIcons name="call-split" size={10} color={COLORS.warning} />
            </View>
          )}
          {expense.tags && expense.tags.length > 0 && expense.tags.slice(0, 2).map((t) => (
            <View key={t} style={[styles.tagPill, { backgroundColor: `${colors.primary}18` }]}>
              <Text style={[styles.tagPillText, { color: colors.primary }]}>#{t}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.expenseRight}>
        <Text style={[styles.expenseAmount, { color: colors.accent }]}>
          -{expense.currency ? formatCurrencyWithCode(expense.amount, expense.currency) : formatCurrency(expense.amount)}
        </Text>
        <Text style={[styles.expenseTime, { color: colors.textMuted }]}>
          {new Date(expense.date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Expenses</Text>
        <View style={styles.headerTotal}>
          <Text style={[styles.headerTotalLabel, { color: colors.textMuted }]}>
            {hasActiveFilters ? 'Filtered' : isAllMonths ? 'All time' : 'This month'}
          </Text>
          <Text style={[styles.headerTotalAmount, { color: colors.accent }]}>
            {formatCurrency(hasActiveFilters ? filteredTotal : monthlyTotal)}
          </Text>
        </View>
      </View>

      {/* Selection Mode Bar */}
      {selectionMode && (
        <View style={[styles.selectionBar, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
          <TouchableOpacity onPress={exitSelectionMode}>
            <MaterialIcons name="close" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.selectionCount, { color: colors.textPrimary }]}>
            {selectedIds.size} selected
          </Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={[styles.bulkBtn, { backgroundColor: colors.primary + '20' }]}
            onPress={() => setShowBulkCategoryModal(true)}
            disabled={selectedIds.size === 0}
          >
            <MaterialIcons name="category" size={18} color={colors.primary} />
            <Text style={[styles.bulkBtnText, { color: colors.primary }]}>Re-categorize</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bulkBtn, { backgroundColor: colors.danger + '20' }]}
            onPress={() => setShowBulkDeleteConfirm(true)}
            disabled={selectedIds.size === 0}
          >
            <MaterialIcons name="delete-outline" size={18} color={colors.danger} />
            <Text style={[styles.bulkBtnText, { color: colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search + Filter Row */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search expenses..."
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText !== '' && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <MaterialIcons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => exportCsv({ expenses: expenses.filter((e) => !e.isFixed), incomes, fixedExpenses, fixedIncomes })}
        >
          <MaterialIcons name="file-download" size={22} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.border }, hasActiveFilters && styles.filterBtnActive]}
          onPress={() => setFilterOpen(true)}
        >
          <MaterialIcons
            name="tune"
            size={22}
            color={hasActiveFilters ? '#FFF' : colors.textMuted}
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
          {(dateFrom || dateTo) && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {dateFrom || '...'} → {dateTo || '...'}
              </Text>
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
                style={[styles.monthItem, { backgroundColor: colors.surface, borderColor: colors.border }, isSelected && styles.monthItemActive]}
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
                  <Text style={[styles.monthText, { color: colors.textMuted }]}>{item}</Text>
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
            <View style={[styles.emptyIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons
                name={hasActiveFilters ? 'filter-list-off' : 'receipt-long'}
                size={48}
                color={colors.textMuted}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {hasActiveFilters ? 'No matches' : 'No expenses yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Tap + to add an expense, or use Quick Add on the Dashboard.\nTip: long-press expenses to select multiple for bulk actions.'}
            </Text>
          </View>
        ) : sortMode !== 'date' ? (
          filteredExpenses.map(renderExpenseItem)
        ) : (
          grouped.map(([date, items]) => (
            <View key={date} style={styles.dateGroup}>
              <View style={[styles.dateHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.dateText, { color: colors.textMuted }]}>{formatGroupDate(date)}</Text>
                <Text style={[styles.dateTotalText, { color: colors.textSecondary }]}>
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
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setFilterOpen(false)}>
              <Text style={[styles.modalCancel, { color: colors.textMuted }]}>Close</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Filters</Text>
            <TouchableOpacity onPress={() => { clearFilters(); setFilterOpen(false); }}>
              <Text style={styles.modalReset}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Sort */}
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Sort By</Text>
            <View style={styles.sortRow}>
              {([
                ['date', 'Date', 'schedule'],
                ['amount_high', 'Highest', 'arrow-upward'],
                ['amount_low', 'Lowest', 'arrow-downward'],
              ] as [SortMode, string, string][]).map(([mode, label, icon]) => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.sortOption, { backgroundColor: colors.surface, borderColor: colors.border }, sortMode === mode && styles.sortOptionActive]}
                  onPress={() => setSortMode(mode)}
                >
                  <MaterialIcons
                    name={icon as any}
                    size={18}
                    color={sortMode === mode ? '#FFF' : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.sortOptionText,
                      { color: colors.textMuted },
                      sortMode === mode && styles.sortOptionTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category */}
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Categories</Text>
            <View style={styles.categoryGrid}>
              {EXPENSE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.has(cat);
                const catColor = CATEGORY_COLORS[cat];
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isSelected && { borderColor: catColor, backgroundColor: `${catColor}18` },
                    ]}
                    onPress={() => toggleCategory(cat)}
                  >
                    <MaterialIcons
                      name={CATEGORY_ICONS[cat] as any}
                      size={16}
                      color={isSelected ? catColor : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: colors.textSecondary },
                        isSelected && { color: catColor },
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
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isSelected && { borderColor: cc.color, backgroundColor: `${cc.color}18` },
                    ]}
                    onPress={() => toggleCategory(cc.name)}
                  >
                    <MaterialIcons
                      name={cc.icon as any}
                      size={16}
                      color={isSelected ? cc.color : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: colors.textSecondary },
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
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Amount Range</Text>
            <View style={styles.amountRow}>
              <View style={[styles.amountInputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.amountPrefix}>{currencySymbol}</Text>
                <TextInput
                  style={[styles.amountInput, { color: colors.textPrimary }]}
                  placeholder="Min"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={minAmount}
                  onChangeText={setMinAmount}
                />
              </View>
              <Text style={[styles.amountDash, { color: colors.textMuted }]}>—</Text>
              <View style={[styles.amountInputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.amountPrefix}>{currencySymbol}</Text>
                <TextInput
                  style={[styles.amountInput, { color: colors.textPrimary }]}
                  placeholder="Max"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={maxAmount}
                  onChangeText={setMaxAmount}
                />
              </View>
            </View>

            {/* Date Range */}
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Date Range</Text>
            <View style={styles.amountRow}>
              <TouchableOpacity
                style={[styles.amountInputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowDateFromPicker(true)}
              >
                <MaterialIcons name="calendar-today" size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
                <Text style={[styles.amountInput, { color: dateFrom ? colors.textPrimary : colors.textMuted }]} numberOfLines={1}>
                  {dateFrom || 'From'}
                </Text>
                {dateFrom !== '' && (
                  <TouchableOpacity onPress={() => setDateFrom('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="close" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              <Text style={[styles.amountDash, { color: colors.textMuted }]}>—</Text>
              <TouchableOpacity
                style={[styles.amountInputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowDateToPicker(true)}
              >
                <MaterialIcons name="calendar-today" size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
                <Text style={[styles.amountInput, { color: dateTo ? colors.textPrimary : colors.textMuted }]} numberOfLines={1}>
                  {dateTo || 'To'}
                </Text>
                {dateTo !== '' && (
                  <TouchableOpacity onPress={() => setDateTo('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="close" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>
            <CalendarPicker
              visible={showDateFromPicker}
              date={dateFrom ? new Date(dateFrom + 'T00:00:00') : new Date()}
              onSelect={(d) => {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                setDateFrom(`${yyyy}-${mm}-${dd}`);
              }}
              onClose={() => setShowDateFromPicker(false)}
              title="From Date"
            />
            <CalendarPicker
              visible={showDateToPicker}
              date={dateTo ? new Date(dateTo + 'T00:00:00') : new Date()}
              onSelect={(d) => {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                setDateTo(`${yyyy}-${mm}-${dd}`);
              }}
              onClose={() => setShowDateToPicker(false)}
              title="To Date"
            />

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

      {/* Bulk Delete Confirm Modal */}
      <Modal visible={showBulkDeleteConfirm} transparent animationType="fade">
        <View style={styles.bulkModalOverlay}>
          <View style={[styles.bulkModalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.bulkModalTitle, { color: colors.textPrimary }]}>Delete {selectedIds.size} Expenses?</Text>
            <Text style={[styles.bulkModalSub, { color: colors.textSecondary }]}>This action can be undone for 5 seconds.</Text>
            <View style={styles.bulkModalBtns}>
              <TouchableOpacity style={[styles.bulkModalBtn, { backgroundColor: colors.background }]} onPress={() => setShowBulkDeleteConfirm(false)}>
                <Text style={[styles.bulkModalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.bulkModalBtn, { backgroundColor: colors.danger }]} onPress={handleBulkDelete}>
                <Text style={[styles.bulkModalBtnText, { color: '#FFF' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bulk Re-categorize Modal */}
      <Modal visible={showBulkCategoryModal} transparent animationType="fade">
        <View style={styles.bulkModalOverlay}>
          <View style={[styles.bulkModalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.bulkModalTitle, { color: colors.textPrimary }]}>Move {selectedIds.size} to Category</Text>
            <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
              <View style={styles.bulkCategoryGrid}>
                {[...EXPENSE_CATEGORIES, ...customCategories.map((c) => c.name)].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.bulkCategoryChip, { backgroundColor: colors.background, borderColor: colors.border }]}
                    onPress={() => handleBulkRecategorize(cat)}
                  >
                    <CategoryIcon category={cat} size={28} />
                    <Text style={[styles.bulkCategoryText, { color: colors.textPrimary }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity style={[styles.bulkModalBtn, { backgroundColor: colors.background, marginTop: SPACING.md }]} onPress={() => setShowBulkCategoryModal(false)}>
              <Text style={[styles.bulkModalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AddExpense')}
        accessibilityLabel="Add expense"
        accessibilityRole="button"
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
    paddingVertical: 4,
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
  tagPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
  },
  tagPillText: {
    fontSize: 9,
    color: COLORS.primary,
    fontWeight: '700',
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
    paddingVertical: 4,
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
  // Selection Mode
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    borderBottomWidth: 1,
  },
  selectionCount: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  selectionCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
    gap: 4,
  },
  bulkBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  bulkModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  bulkModalContent: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  bulkModalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  bulkModalSub: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.md,
  },
  bulkModalBtns: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  bulkModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  bulkModalBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  bulkCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  bulkCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  bulkCategoryText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
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
