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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExpenseStore } from '../store/useExpenseStore';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import {
  Income,
  INCOME_SOURCES,
  INCOME_SOURCE_ICONS,
  INCOME_SOURCE_COLORS,
  IncomeSource,
} from '../types';
import { formatCurrency } from '../utils/currency';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const groupIncomesByDate = (incomes: Income[]) => {
  const groups: Record<string, Income[]> = {};
  incomes.forEach((income) => {
    const date = new Date(income.date).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(income);
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

export const IncomeListScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const isStackScreen = route.name === 'IncomeList';
  const { incomes, currencySymbol } = useExpenseStore();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth());
  const [selectedYear] = useState(new Date().getFullYear());
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
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

  const monthlyIncomes = useMemo(() => {
    if (isAllMonths) {
      return [...incomes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    return incomes.filter((i) => i.date.startsWith(monthKey))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [incomes, selectedMonth, selectedYear, isAllMonths]);

  const toggleSource = (src: string) => {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      if (next.has(src)) next.delete(src);
      else next.add(src);
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedSources(new Set());
    setMinAmount('');
    setMaxAmount('');
    setSortMode('date');
    setSearchText('');
  };

  const hasActiveFilters = selectedSources.size > 0 || minAmount !== '' || maxAmount !== '' || sortMode !== 'date' || searchText !== '';

  const filteredIncomes = useMemo(() => {
    let result = [...monthlyIncomes];

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (i) =>
          i.description.toLowerCase().includes(q) ||
          i.source.toLowerCase().includes(q)
      );
    }

    if (selectedSources.size > 0) {
      result = result.filter((i) => selectedSources.has(i.source));
    }

    const min = parseFloat(minAmount);
    const max = parseFloat(maxAmount);
    if (!isNaN(min)) result = result.filter((i) => i.amount >= min);
    if (!isNaN(max)) result = result.filter((i) => i.amount <= max);

    if (sortMode === 'amount_high') {
      result.sort((a, b) => b.amount - a.amount);
    } else if (sortMode === 'amount_low') {
      result.sort((a, b) => a.amount - b.amount);
    } else {
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return result;
  }, [monthlyIncomes, selectedSources, minAmount, maxAmount, sortMode, searchText]);

  const filteredTotal = filteredIncomes.reduce((s, i) => s + i.amount, 0);
  const monthlyTotal = isAllMonths
    ? incomes.reduce((s, i) => s + i.amount, 0)
    : monthlyIncomes.reduce((s, i) => s + i.amount, 0);
  const grouped = groupIncomesByDate(filteredIncomes);

  const renderIncomeItem = (income: Income) => {
    const sourceColor = INCOME_SOURCE_COLORS[income.source as IncomeSource] || COLORS.success;
    const sourceIcon = INCOME_SOURCE_ICONS[income.source as IncomeSource] || 'attach-money';

    return (
      <TouchableOpacity
        key={income.id}
        style={[styles.incomeItem, { borderColor: `${sourceColor}15`, backgroundColor: colors.surface }]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('AddIncome', { income })}
      >
        <View style={[styles.incomeIconWrap, { backgroundColor: `${sourceColor}20` }]}>
          <MaterialIcons name={sourceIcon as any} size={22} color={sourceColor} />
        </View>
        <View style={styles.incomeInfo}>
          <Text style={[styles.incomeDesc, { color: colors.textPrimary }]}>
            {income.description || income.source}
          </Text>
          <Text style={[styles.incomeSource, { color: sourceColor }]}>{income.source}</Text>
        </View>
        <View style={styles.incomeRight}>
          <Text style={styles.incomeAmount}>+{formatCurrency(income.amount)}</Text>
          <Text style={[styles.incomeTime, { color: colors.textMuted }]}>
            {new Date(income.date).toLocaleTimeString('en-US', {
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
        {isStackScreen && (
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Income</Text>
        <View style={styles.headerTotal}>
          <Text style={[styles.headerTotalLabel, { color: colors.textMuted }]}>
            {hasActiveFilters ? 'Filtered' : isAllMonths ? 'All time' : 'This month'}
          </Text>
          <Text style={styles.headerTotalAmount}>
            {formatCurrency(hasActiveFilters ? filteredTotal : monthlyTotal)}
          </Text>
        </View>
      </View>

      {/* Search + Filter Row */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search income..."
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
          {selectedSources.size > 0 && (
            <View style={[styles.chip, { backgroundColor: `${colors.success}20` }]}>
              <Text style={styles.chipText}>
                {selectedSources.size} {selectedSources.size === 1 ? 'source' : 'sources'}
              </Text>
            </View>
          )}
          {minAmount !== '' && (
            <View style={[styles.chip, { backgroundColor: `${colors.success}20` }]}>
              <Text style={styles.chipText}>Min: {currencySymbol}{minAmount}</Text>
            </View>
          )}
          {maxAmount !== '' && (
            <View style={[styles.chip, { backgroundColor: `${colors.success}20` }]}>
              <Text style={styles.chipText}>Max: {currencySymbol}{maxAmount}</Text>
            </View>
          )}
          {sortMode !== 'date' && (
            <View style={[styles.chip, { backgroundColor: `${colors.success}20` }]}>
              <Text style={styles.chipText}>
                {sortMode === 'amount_high' ? 'Highest first' : 'Lowest first'}
              </Text>
            </View>
          )}
          <TouchableOpacity style={[styles.chipClear, { backgroundColor: `${colors.danger}18` }]} onPress={clearFilters}>
            <MaterialIcons name="close" size={12} color={colors.danger} />
            <Text style={[styles.chipText, { color: colors.danger }]}>Clear</Text>
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
                    colors={['#00D68F', '#45B7D1']}
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

      {/* Income List */}
      <Animated.ScrollView
        style={[styles.list, { opacity: fadeAnim }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {filteredIncomes.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons
                name={hasActiveFilters ? 'filter-list-off' : 'account-balance'}
                size={48}
                color={colors.textMuted}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {hasActiveFilters ? 'No matches' : 'No income yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Tap + to record income like gifts, bonuses, or freelance earnings.\nRecurring income (salary, etc.) can be set up in the Recurring tab.'}
            </Text>
          </View>
        ) : sortMode !== 'date' ? (
          filteredIncomes.map(renderIncomeItem)
        ) : (
          grouped.map(([date, items]) => (
            <View key={date} style={styles.dateGroup}>
              <View style={[styles.dateHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.dateText, { color: colors.textMuted }]}>{formatGroupDate(date)}</Text>
                <Text style={[styles.dateTotalText, { color: colors.textSecondary }]}>
                  {formatCurrency(items.reduce((s, i) => s + i.amount, 0))}
                </Text>
              </View>
              {items.map(renderIncomeItem)}
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

            {/* Source */}
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Sources</Text>
            <View style={styles.sourceGrid}>
              {INCOME_SOURCES.map((src) => {
                const isSelected = selectedSources.has(src);
                const color = INCOME_SOURCE_COLORS[src];
                return (
                  <TouchableOpacity
                    key={src}
                    style={[
                      styles.sourceChip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isSelected && { borderColor: color, backgroundColor: `${color}18` },
                    ]}
                    onPress={() => toggleSource(src)}
                  >
                    <MaterialIcons
                      name={INCOME_SOURCE_ICONS[src] as any}
                      size={16}
                      color={isSelected ? color : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.sourceChipText,
                        { color: colors.textSecondary },
                        isSelected && { color },
                      ]}
                    >
                      {src}
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

            {/* Apply */}
            <TouchableOpacity
              style={styles.applyBtn}
              activeOpacity={0.8}
              onPress={() => setFilterOpen(false)}
            >
              <LinearGradient
                colors={['#00D68F', '#45B7D1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.applyBtnGradient}
              >
                <Text style={styles.applyBtnText}>
                  Show Results ({filteredIncomes.length})
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
        onPress={() => navigation.navigate('AddIncome')}
        accessibilityLabel="Add income"
        accessibilityRole="button"
      >
        <LinearGradient
          colors={['#00D68F', '#45B7D1']}
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
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerTotal: {
    alignItems: 'flex-end',
  },
  headerTotalLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTotalAmount: {
    fontSize: FONT_SIZE.xl,
    color: '#00D68F',
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
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    height: 40,
    borderWidth: 1,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    paddingVertical: 4,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  filterBtnActive: {
    backgroundColor: '#00D68F',
    borderColor: '#00D68F',
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
    backgroundColor: 'rgba(0, 214, 143, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
  },
  chipText: {
    fontSize: 10,
    color: '#00D68F',
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
    borderBottomColor: 'rgba(0, 214, 143, 0.08)',
  },
  dateText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dateTotalText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  incomeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 33, 62, 0.6)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    gap: SPACING.md,
  },
  incomeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomeInfo: {
    flex: 1,
  },
  incomeDesc: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  incomeSource: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  incomeRight: {
    alignItems: 'flex-end',
  },
  incomeAmount: {
    fontSize: FONT_SIZE.lg,
    color: '#00D68F',
    fontWeight: '700',
    marginBottom: 2,
  },
  incomeTime: {
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Filter Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
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
    borderWidth: 1,
  },
  sortOptionActive: {
    backgroundColor: '#00D68F',
    borderColor: '#00D68F',
  },
  sortOptionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  sortOptionTextActive: {
    color: '#FFF',
  },

  // Source Grid
  sourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  sourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1.5,
    gap: 6,
  },
  sourceChipText: {
    fontSize: FONT_SIZE.sm,
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
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    height: 48,
  },
  amountPrefix: {
    fontSize: FONT_SIZE.lg,
    color: '#00D68F',
    fontWeight: '700',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    paddingVertical: 4,
  },
  amountDash: {
    fontSize: FONT_SIZE.lg,
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
