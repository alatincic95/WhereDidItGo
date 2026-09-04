import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useExpenseStore } from '../store/useExpenseStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { DashboardCardId, DEFAULT_DASHBOARD_CARDS } from '../types';
import { formatCurrency } from '../utils/currency';
import { generateSpendingInsights } from '../utils/spendingInsights';
import { GlassCard } from '../components/GlassCard';
import {
  HeroBalanceCard,
  BudgetUsageCard,
  TopCategoriesCard,
  QuickActionsRow,
  RecentTransactions,
  DashboardFAB,
  DashboardModals,
  QuickAddBar,
  ExpenseTemplatesRow,
  AccountAvatar,
  AccountSwitcherModal,
  CryptoSummaryCard,
  SafeToSpendCard,
  getCurrentMonth,
  getCurrentMonthName,
  getGreeting,
  COMPACT_BREAKPOINT,
} from '../components/dashboard';
import type { ViewMode } from '../components/dashboard';
import { calculateSafeToSpend } from '../utils/safeToSpend';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isCompact = screenWidth < COMPACT_BREAKPOINT;
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');
  const [fabOpen, setFabOpen] = useState(false);
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [exchangeRateOpen, setExchangeRateOpen] = useState(false);
  const [newRateCurrency, setNewRateCurrency] = useState('');
  const [newRateValue, setNewRateValue] = useState('');
  const [backupMenuOpen, setBackupMenuOpen] = useState(false);
  const [insightsExpanded, setInsightsExpanded] = useState(false);
  const [accountSwitcherOpen, setAccountSwitcherOpen] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<any>(null);
  const [restoreMessage, setRestoreMessage] = useState('');

  const {
    monthlyIncome,
    initialBalance,
    expenses,
    incomes,
    fixedExpenses,
    budgets,
    customCategories,
    getMonthlyTotal,
    getFixedExpensesTotal,
    getMonthlyExtraIncome,
    getMonthlyBalance,
    getOverallBalance,
    getTotalExpensesAllTime,
    getCategoryTotals,
    getAllTimeCategoryTotals,
    getTrackedMonths,
    getBudgetTotal,
    fixedIncomes,
    getFixedIncomesTotal,
    setMonthlyIncome,
    setInitialBalance,
    currencySymbol,
    categoryBudgets,
    getCategoryBudgetStatus,
    dashboardCards,
    selectedAccountId,
    cryptoHoldings,
    getCryptoPortfolioValue,
    useRecurringAsMonthlyIncome,
  } = useExpenseStore();

  const { getUnreadCount, generateSmartNotifications } = useNotificationStore();
  const unreadCount = getUnreadCount();

  const currentMonth = getCurrentMonth();
  const monthlyTotal = getMonthlyTotal(currentMonth);
  const fixedTotal = selectedAccountId ? 0 : getFixedExpensesTotal();
  const monthlyBalance = getMonthlyBalance(currentMonth);
  const overallBalance = getOverallBalance();
  const totalAllTime = getTotalExpensesAllTime();
  const trackedMonths = getTrackedMonths();

  const extraIncome = getMonthlyExtraIncome(currentMonth);

  const monthlyCategoryTotals = getCategoryTotals(currentMonth);
  const allTimeCategoryTotals = getAllTimeCategoryTotals();

  const fixedIncomeTotal = getFixedIncomesTotal();
  const totalSpentThisMonth = selectedAccountId
    ? monthlyTotal
    : monthlyTotal + fixedTotal;
  const totalIncomeThisMonth = selectedAccountId
    ? extraIncome
    : monthlyIncome + fixedIncomeTotal + extraIncome;
  const spendingPercentage = totalIncomeThisMonth > 0 ? totalSpentThisMonth / totalIncomeThisMonth : 0;

  const categoryBudgetStatuses = getCategoryBudgetStatus(currentMonth);
  const categoryBudgetMap = new Map(
    categoryBudgetStatuses.filter((s) => s.enabled).map((s) => [s.category, s])
  );

  // Smart notifications
  useEffect(() => {
    generateSmartNotifications({
      monthlyBudget: monthlyIncome,
      totalSpent: monthlyTotal,
      fixedTotal,
      projects: budgets.map((p) => ({
        id: p.id,
        name: p.name,
        budget: p.budget,
        spent: getBudgetTotal(p.id),
        status: p.status,
      })),
      fixedExpenses: fixedExpenses.map((f) => ({
        description: f.description,
        amount: f.amount,
      })),
      categoryBudgets: categoryBudgetStatuses
        .filter((s) => s.enabled)
        .map((s) => ({ category: s.category, limit: s.limit, spent: s.spent, percentage: s.percentage })),
    });
  }, [monthlyTotal, fixedTotal, budgets.length, expenses.length, incomes.length, categoryBudgets.length]);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const cardSlides = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(40))
  ).current;
  const cardFades = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();

    cardSlides.forEach((anim, i) => {
      Animated.timing(anim, { toValue: 0, duration: 500, delay: 200 + i * 100, useNativeDriver: true }).start();
    });
    cardFades.forEach((anim, i) => {
      Animated.timing(anim, { toValue: 1, duration: 500, delay: 200 + i * 100, useNativeDriver: true }).start();
    });
  }, []);

  // Merge expenses and incomes for recent transactions
  const recentTransactions = [
    ...expenses.map((e) => ({ ...e, type: 'expense' as const })),
    ...incomes.map((i) => ({ ...i, type: 'income' as const })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const categoryTotals = viewMode === 'monthly' ? monthlyCategoryTotals : allTimeCategoryTotals;
  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const handleSaveIncome = () => {
    const val = parseFloat(incomeInput);
    if (!isNaN(val) && val >= 0) {
      setMonthlyIncome(val);
    }
    setEditingIncome(false);
  };

  // Dashboard card visibility/order
  const allCardIds: DashboardCardId[] = DEFAULT_DASHBOARD_CARDS.map((c) => c.id);
  const cardConfig = dashboardCards && dashboardCards.length > 0 ? dashboardCards : DEFAULT_DASHBOARD_CARDS;
  // Ensure all IDs present
  const orderedCards = [
    ...cardConfig.filter((c) => allCardIds.includes(c.id)),
    ...allCardIds.filter((id) => !cardConfig.some((c) => c.id === id)).map((id) => ({ id, visible: true })),
  ];
  const isCardVisible = (id: DashboardCardId) => orderedCards.find((c) => c.id === id)?.visible !== false;

  // Safe to spend for hero card
  const safeToSpend = useMemo(
    () => calculateSafeToSpend(
      monthlyIncome, fixedIncomeTotal, extraIncome,
      totalSpentThisMonth, fixedTotal, useRecurringAsMonthlyIncome,
    ),
    [monthlyIncome, fixedIncomeTotal, extraIncome, totalSpentThisMonth, fixedTotal, useRecurringAsMonthlyIncome],
  );

  // Hero values based on mode
  const heroLabel = viewMode === 'monthly' ? getCurrentMonthName() : 'Overall Balance';
  const heroBalance = viewMode === 'monthly' ? monthlyBalance : overallBalance;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View
          style={[styles.header, { paddingTop: insets.top + 16, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <AccountAvatar onPress={() => setAccountSwitcherOpen(true)} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Accounts</Text>
          </View>
          {!isCompact && (
            <>
              <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setBackupMenuOpen(true)}>
                <MaterialIcons name="save-alt" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setExchangeRateOpen(true)}>
                <MaterialIcons name="currency-exchange" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setCurrencyPickerOpen(true)}>
                <Text style={[styles.currencyBtnText, { color: colors.textSecondary }]}>{currencySymbol}</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('GlobalSearch')}
            accessibilityLabel="Search"
            accessibilityRole="button"
          >
            <MaterialIcons name="search" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Notifications')}
            accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
            accessibilityRole="button"
          >
            <MaterialIcons
              name={unreadCount > 0 ? 'notifications' : 'notifications-none'}
              size={24}
              color={unreadCount > 0 ? colors.primary : colors.textSecondary}
            />
            {unreadCount > 0 && (
              <View style={[styles.notificationBadge, { borderColor: colors.background }]}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {isCompact ? (
            <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setHamburgerOpen(true)} accessibilityLabel="Menu" accessibilityRole="button">
              <MaterialIcons name="menu" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => navigation.navigate('Settings' as never)} accessibilityLabel="Settings" accessibilityRole="button">
              <MaterialIcons name="settings" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Hero Balance Card — tap to toggle monthly/overall */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          <HeroBalanceCard
            viewMode={viewMode}
            onToggleViewMode={() => setViewMode(viewMode === 'monthly' ? 'overall' : 'monthly')}
            heroLabel={heroLabel}
            heroBalance={heroBalance}
            totalIncomeThisMonth={totalIncomeThisMonth}
            totalSpentThisMonth={totalSpentThisMonth}
            trackedMonths={trackedMonths}
            safeToSpendDaily={safeToSpend.daily}
            daysLeft={safeToSpend.daysLeft}
            formatCurrency={formatCurrency}
          />
        </Animated.View>

        {/* Safe to Spend */}
        {viewMode === 'monthly' && (
          <SafeToSpendCard currentMonth={currentMonth} />
        )}

        {/* Quick Add Bar */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <QuickAddBar />
        </Animated.View>

        {/* Quick Actions — always visible below Quick Add */}
        <Animated.View
          style={[styles.quickActionsRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <QuickActionsRow navigation={navigation} />
        </Animated.View>

        {/* Expense Templates */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <ExpenseTemplatesRow />
        </Animated.View>

        {/* Spending Insights */}
        {(() => {
          const insights = generateSpendingInsights(expenses, fixedExpenses, monthlyIncome, currencySymbol);
          if (insights.length === 0) return null;
          return (
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], marginBottom: SPACING.md }}>
              <View style={{ backgroundColor: colors.surface, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md }}
                  activeOpacity={0.7}
                  onPress={() => setInsightsExpanded(!insightsExpanded)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialIcons name="lightbulb" size={18} color={colors.warning} />
                    <Text style={{ fontSize: FONT_SIZE.md, fontWeight: '700', color: colors.textPrimary }}>
                      Insights
                    </Text>
                    {!insightsExpanded && (
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: BORDER_RADIUS.round, backgroundColor: `${colors.warning}20` }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.warning }}>{insights.length}</Text>
                      </View>
                    )}
                  </View>
                  <MaterialIcons name={insightsExpanded ? 'expand-less' : 'expand-more'} size={24} color={colors.textMuted} />
                </TouchableOpacity>
                {insightsExpanded && (
                  <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.md }}>
                    {insights.slice(0, 3).map((insight, index) => (
                      <View key={insight.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, paddingVertical: SPACING.sm, borderTopWidth: index === 0 ? 1 : 0, borderTopColor: colors.border }}>
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${insight.color}18`, justifyContent: 'center', alignItems: 'center' }}>
                          <MaterialIcons name={insight.icon as any} size={16} color={insight.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 }}>
                            {insight.title}
                          </Text>
                          <Text style={{ fontSize: FONT_SIZE.sm, color: colors.textSecondary, lineHeight: 18 }}>
                            {insight.message}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </Animated.View>
          );
        })()}

        {/* Dashboard cards rendered in user-configured order */}
        {orderedCards.filter((c) => c.visible).map((card, idx) => {
          const animIdx = Math.min(idx, cardSlides.length - 1);
          switch (card.id) {
            case 'summary':
              // Income/Expenses summary folded into HeroBalanceCard
              if (cryptoHoldings.length === 0) return null;
              return (
                <Animated.View key="summary" style={{ opacity: cardFades[animIdx], transform: [{ translateY: cardSlides[animIdx] }], marginBottom: SPACING.md }}>
                  <CryptoSummaryCard
                    portfolioValue={getCryptoPortfolioValue()}
                    holdingsCount={cryptoHoldings.length}
                    formatCurrency={formatCurrency}
                    onPress={() => navigation.navigate('Crypto')}
                  />
                </Animated.View>
              );
            case 'budgetUsage':
              if (viewMode !== 'monthly' || totalIncomeThisMonth <= 0) return null;
              return (
                <Animated.View key="budgetUsage" style={{ opacity: cardFades[animIdx], transform: [{ translateY: cardSlides[animIdx] }], marginBottom: SPACING.md }}>
                  <BudgetUsageCard
                    spendingPercentage={spendingPercentage}
                    monthlyBalance={monthlyBalance}
                    totalIncomeThisMonth={totalIncomeThisMonth}
                    formatCurrency={formatCurrency}
                  />
                </Animated.View>
              );
            case 'categories':
              return (
                <Animated.View key="categories" style={{ opacity: cardFades[animIdx], transform: [{ translateY: cardSlides[animIdx] }], marginBottom: SPACING.md }}>
                  <TopCategoriesCard
                    sortedCategories={sortedCategories}
                    customCategories={customCategories}
                    categoryBudgetMap={categoryBudgetMap}
                    viewMode={viewMode}
                    formatCurrency={formatCurrency}
                  />
                </Animated.View>
              );
            case 'quickActions':
              // Quick Actions moved above customizable cards (always visible below Quick Add)
              return null;
            case 'recentTransactions':
              return (
                <Animated.View key="recentTransactions" style={{ opacity: cardFades[animIdx], transform: [{ translateY: cardSlides[animIdx] }], marginBottom: SPACING.md }}>
                  <RecentTransactions
                    recentTransactions={recentTransactions}
                    navigation={navigation}
                    formatCurrency={formatCurrency}
                  />
                </Animated.View>
              );
            default:
              return null;
          }
        })}

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* FAB */}
      <DashboardFAB fabOpen={fabOpen} setFabOpen={setFabOpen} navigation={navigation} />

      {/* Modals */}
      <DashboardModals
        editingIncome={editingIncome}
        setEditingIncome={setEditingIncome}
        incomeInput={incomeInput}
        setIncomeInput={setIncomeInput}
        onSaveIncome={handleSaveIncome}
        currencyPickerOpen={currencyPickerOpen}
        setCurrencyPickerOpen={setCurrencyPickerOpen}
        exchangeRateOpen={exchangeRateOpen}
        setExchangeRateOpen={setExchangeRateOpen}
        newRateCurrency={newRateCurrency}
        setNewRateCurrency={setNewRateCurrency}
        newRateValue={newRateValue}
        setNewRateValue={setNewRateValue}
        backupMenuOpen={backupMenuOpen}
        setBackupMenuOpen={setBackupMenuOpen}
        hamburgerOpen={hamburgerOpen}
        setHamburgerOpen={setHamburgerOpen}
        restoreConfirmOpen={restoreConfirmOpen}
        setRestoreConfirmOpen={setRestoreConfirmOpen}
        pendingRestore={pendingRestore}
        setPendingRestore={setPendingRestore}
        restoreMessage={restoreMessage}
        setRestoreMessage={setRestoreMessage}
        navigation={navigation}
      />

      {/* Account Switcher */}
      <AccountSwitcherModal
        visible={accountSwitcherOpen}
        onClose={() => setAccountSwitcherOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currencyBtnText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.round,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  notificationBadgeText: {
    fontSize: 9,
    color: '#FFF',
    fontWeight: '800',
  },
  quickActionsRow: {
    marginBottom: SPACING.lg,
  },
});
