import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../components/GlassCard';
import { CategoryIcon } from '../components/CategoryIcon';
import { useExpenseStore } from '../store/useExpenseStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { CATEGORY_COLORS, ExpenseCategory, INCOME_SOURCE_COLORS, INCOME_SOURCE_ICONS, IncomeSource } from '../types';
import { formatCurrency, formatCurrencyWithCode, CURRENCY_OPTIONS, getCurrencySymbol } from '../utils/currency';
import { exportCsv } from '../utils/exportData';

type ViewMode = 'monthly' | 'overall';

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getCurrentMonthName = () => {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');
  const [fabOpen, setFabOpen] = useState(false);
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [exchangeRateOpen, setExchangeRateOpen] = useState(false);
  const [newRateCurrency, setNewRateCurrency] = useState('');
  const [newRateValue, setNewRateValue] = useState('');

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
    getTotalExtraIncomeAllTime,
    getCategoryTotals,
    getAllTimeCategoryTotals,
    getTrackedMonths,
    getBudgetTotal,
    fixedIncomes,
    getFixedIncomesTotal,
    setMonthlyIncome,
    setInitialBalance,
    currencySymbol,
    setCurrencySymbol,
    exchangeRates,
    addExchangeRate,
    deleteExchangeRate,
  } = useExpenseStore();

  const { getUnreadCount, generateSmartNotifications } = useNotificationStore();
  const unreadCount = getUnreadCount();

  const currentMonth = getCurrentMonth();
  const monthlyTotal = getMonthlyTotal(currentMonth);
  const fixedTotal = getFixedExpensesTotal();
  const monthlyBalance = getMonthlyBalance(currentMonth);
  const overallBalance = getOverallBalance();
  const totalAllTime = getTotalExpensesAllTime();
  const trackedMonths = getTrackedMonths();

  const extraIncome = getMonthlyExtraIncome(currentMonth);
  const totalExtraIncomeAllTime = getTotalExtraIncomeAllTime();

  const monthlyCategoryTotals = getCategoryTotals(currentMonth);
  const allTimeCategoryTotals = getAllTimeCategoryTotals();

  const fixedIncomeTotal = getFixedIncomesTotal();
  const totalSpentThisMonth = monthlyTotal + fixedTotal;
  const totalIncomeThisMonth = monthlyIncome + fixedIncomeTotal + extraIncome;
  const spendingPercentage = totalIncomeThisMonth > 0 ? totalSpentThisMonth / totalIncomeThisMonth : 0;

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
    });
  }, [monthlyTotal, fixedTotal, budgets.length, expenses.length, incomes.length]);

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

  // Hero values based on mode
  const heroLabel = viewMode === 'monthly' ? getCurrentMonthName() : 'Overall Balance';
  const heroBalance = viewMode === 'monthly' ? monthlyBalance : overallBalance;
  const heroGradient: [string, string, string] =
    viewMode === 'monthly'
      ? ['#6C63FF', '#9B59B6', '#FF6B9D']
      : ['#00D68F', '#45B7D1', '#6C63FF'];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View
          style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View>
            <Text style={styles.greeting}>Good {getGreeting()}</Text>
            <Text style={styles.headerTitle}>Your Finances</Text>
          </View>
          <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => exportCsv({ expenses, incomes, fixedExpenses, fixedIncomes })}
          >
            <MaterialIcons name="file-download" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setExchangeRateOpen(true)}
          >
            <MaterialIcons name="currency-exchange" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setCurrencyPickerOpen(true)}
          >
            <Text style={styles.currencyBtnText}>{currencySymbol}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <MaterialIcons
              name={unreadCount > 0 ? 'notifications' : 'notifications-none'}
              size={24}
              color={unreadCount > 0 ? COLORS.primary : COLORS.textSecondary}
            />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          </View>
        </Animated.View>

        {/* View Mode Toggle */}
        <Animated.View
          style={[styles.toggleContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.toggleWrapper}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'monthly' && styles.toggleBtnActive]}
              onPress={() => setViewMode('monthly')}
            >
              {viewMode === 'monthly' ? (
                <LinearGradient
                  colors={['#6C63FF', '#9B59B6']}
                  style={styles.toggleGradient}
                >
                  <MaterialIcons name="calendar-today" size={16} color="#FFF" />
                  <Text style={styles.toggleTextActive}>Monthly</Text>
                </LinearGradient>
              ) : (
                <>
                  <MaterialIcons name="calendar-today" size={16} color={COLORS.textMuted} />
                  <Text style={styles.toggleText}>Monthly</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === 'overall' && styles.toggleBtnActive]}
              onPress={() => setViewMode('overall')}
            >
              {viewMode === 'overall' ? (
                <LinearGradient
                  colors={['#00D68F', '#45B7D1']}
                  style={styles.toggleGradient}
                >
                  <MaterialIcons name="account-balance" size={16} color="#FFF" />
                  <Text style={styles.toggleTextActive}>Overall</Text>
                </LinearGradient>
              ) : (
                <>
                  <MaterialIcons name="account-balance" size={16} color={COLORS.textMuted} />
                  <Text style={styles.toggleText}>Overall</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Hero Balance Card */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={[styles.heroCircle, styles.heroCircle1]} />
              <View style={[styles.heroCircle, styles.heroCircle2]} />
              <View style={[styles.heroCircle, styles.heroCircle3]} />

              <View style={styles.heroContent}>
                <Text style={styles.heroLabel}>{heroLabel}</Text>
                <Text style={styles.heroAmount}>{formatCurrency(heroBalance)}</Text>

                {viewMode === 'monthly' ? (
                  <View style={styles.heroMeta}>
                    <View style={styles.heroMetaItem}>
                      <MaterialIcons name="trending-down" size={16} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.heroMetaText}>
                        {formatCurrency(totalSpentThisMonth)} spent
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.heroMeta}>
                    <View style={styles.heroMetaItem}>
                      <MaterialIcons name="history" size={16} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.heroMetaText}>
                        {trackedMonths.length} month{trackedMonths.length !== 1 ? 's' : ''} tracked
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.sparkleContainer}>
                <Text style={styles.sparkle}>✦</Text>
                <Text style={[styles.sparkle, styles.sparkle2]}>✦</Text>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Summary Cards - different per mode */}
        <Animated.View
          style={[styles.monthlyRow, { opacity: cardFades[0], transform: [{ translateY: cardSlides[0] }] }]}
        >
          {viewMode === 'monthly' ? (
            <>
              {/* Income Card */}
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={0.7}
                onPress={() => {
                  setIncomeInput(monthlyIncome.toString());
                  setEditingIncome(true);
                }}
              >
                <GlassCard style={styles.summaryCard} glowColor={COLORS.success} intensity="low">
                  <View style={styles.summaryCardIcon}>
                    <MaterialIcons name="attach-money" size={20} color={COLORS.success} />
                  </View>
                  <Text style={styles.summaryCardLabel}>Income</Text>
                  <Text style={[styles.summaryCardAmount, { color: COLORS.success }]}>
                    {formatCurrency(totalIncomeThisMonth)}
                  </Text>
                  {extraIncome > 0 ? (
                    <Text style={styles.summaryCardHint}>+{formatCurrency(extraIncome)} extra</Text>
                  ) : (
                    <Text style={styles.summaryCardHint}>Tap to edit base</Text>
                  )}
                </GlassCard>
              </TouchableOpacity>

              {/* Expenses Card */}
              <View style={{ flex: 1 }}>
                <GlassCard style={styles.summaryCard} glowColor={COLORS.accent} intensity="low">
                  <View style={[styles.summaryCardIcon, { backgroundColor: 'rgba(255, 107, 157, 0.12)' }]}>
                    <MaterialIcons name="shopping-cart" size={20} color={COLORS.accent} />
                  </View>
                  <Text style={styles.summaryCardLabel}>Expenses</Text>
                  <Text style={[styles.summaryCardAmount, { color: COLORS.accent }]}>
                    {formatCurrency(totalSpentThisMonth)}
                  </Text>
                  <Text style={styles.summaryCardHint}>incl. fixed</Text>
                </GlassCard>
              </View>
            </>
          ) : (
            <>
              {/* Initial Balance Card */}
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={0.7}
                onPress={() => {
                  Alert.prompt?.(
                    'Starting Balance',
                    'Enter your initial balance before tracking',
                    (text) => {
                      const val = parseFloat(text);
                      if (!isNaN(val)) setInitialBalance(val);
                    },
                    'plain-text',
                    initialBalance.toString()
                  ) ??
                    Alert.alert('Starting Balance', `Current: ${formatCurrency(initialBalance)}`);
                }}
              >
                <GlassCard style={styles.summaryCard} glowColor="#45B7D1" intensity="low">
                  <View style={[styles.summaryCardIcon, { backgroundColor: 'rgba(69, 183, 209, 0.12)' }]}>
                    <MaterialIcons name="savings" size={20} color="#45B7D1" />
                  </View>
                  <Text style={styles.summaryCardLabel}>Starting</Text>
                  <Text style={[styles.summaryCardAmount, { color: '#45B7D1' }]}>
                    {formatCurrency(initialBalance)}
                  </Text>
                  <Text style={styles.summaryCardHint}>Tap to edit</Text>
                </GlassCard>
              </TouchableOpacity>

              {/* Total Spent All Time */}
              <View style={{ flex: 1 }}>
                <GlassCard style={styles.summaryCard} glowColor={COLORS.accent} intensity="low">
                  <View style={[styles.summaryCardIcon, { backgroundColor: 'rgba(255, 107, 157, 0.12)' }]}>
                    <MaterialIcons name="receipt-long" size={20} color={COLORS.accent} />
                  </View>
                  <Text style={styles.summaryCardLabel}>All Time</Text>
                  <Text style={[styles.summaryCardAmount, { color: COLORS.accent }]}>
                    {formatCurrency(totalAllTime)}
                  </Text>
                  <Text style={styles.summaryCardHint}>total spent</Text>
                </GlassCard>
              </View>
            </>
          )}
        </Animated.View>

        {/* Spending Progress (monthly only) */}
        {viewMode === 'monthly' && totalIncomeThisMonth > 0 && (
          <Animated.View style={{ opacity: cardFades[1], transform: [{ translateY: cardSlides[1] }] }}>
            <GlassCard style={styles.spendingCard} glowColor={COLORS.primary} intensity="low">
              <View style={styles.spendingHeader}>
                <Text style={styles.sectionTitle}>Budget Usage</Text>
                <Text style={[
                  styles.spendingPercent,
                  spendingPercentage > 1 && { color: COLORS.danger },
                ]}>
                  {Math.round(spendingPercentage * 100)}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={
                    spendingPercentage > 0.9
                      ? ['#FF3D71', '#FF6B8A']
                      : spendingPercentage > 0.7
                      ? ['#FFAA00', '#FFBB33']
                      : ['#6C63FF', '#BB8FCE']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(spendingPercentage * 100, 100)}%` },
                  ]}
                />
              </View>
              <View style={styles.spendingFooter}>
                <Text style={styles.spendingSubtext}>
                  {monthlyBalance >= 0
                    ? `${formatCurrency(monthlyBalance)} remaining`
                    : `${formatCurrency(Math.abs(monthlyBalance))} over budget`}
                </Text>
                <Text style={styles.spendingSubtext}>
                  of {formatCurrency(totalIncomeThisMonth)}
                </Text>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Category Breakdown */}
        <Animated.View style={{ opacity: cardFades[2], transform: [{ translateY: cardSlides[2] }] }}>
          <GlassCard style={styles.categoriesCard} intensity="low">
            <Text style={styles.sectionTitle}>
              {viewMode === 'monthly' ? 'Top Categories' : 'All Time Categories'}
            </Text>
            {sortedCategories.length === 0 ? (
              <Text style={styles.emptyText}>No expenses yet this month</Text>
            ) : (
              sortedCategories.map(([category, amount]) => {
                const maxAmount = sortedCategories[0][1];
                const percentage = amount / maxAmount;
                const customCat = customCategories.find((c) => c.name === category);
                const color = customCat?.color || CATEGORY_COLORS[category as ExpenseCategory] || '#AEB6BF';
                return (
                  <View key={category} style={styles.categoryRow}>
                    <CategoryIcon category={category} size={36} />
                    <View style={styles.categoryInfo}>
                      <View style={styles.categoryHeader}>
                        <Text style={styles.categoryName}>{category}</Text>
                        <Text style={styles.categoryAmount}>{formatCurrency(amount)}</Text>
                      </View>
                      <View style={styles.categoryBar}>
                        <View
                          style={[
                            styles.categoryBarFill,
                            { width: `${percentage * 100}%`, backgroundColor: color },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </GlassCard>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          style={[styles.quickActionsRow, { opacity: cardFades[3], transform: [{ translateY: cardSlides[3] }] }]}
        >
          <TouchableOpacity
            style={styles.quickActionCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Trends')}
          >
            <LinearGradient
              colors={['rgba(108, 99, 255, 0.15)', 'rgba(187, 143, 206, 0.08)']}
              style={styles.quickActionGradient}
            >
              <View style={styles.quickActionIcon}>
                <MaterialIcons name="trending-up" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.quickActionLabel}>Trends</Text>
              <MaterialIcons name="chevron-right" size={18} color={COLORS.textMuted} />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SavingsGoals')}
          >
            <LinearGradient
              colors={['rgba(0, 214, 143, 0.15)', 'rgba(69, 183, 209, 0.08)']}
              style={styles.quickActionGradient}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(0, 214, 143, 0.15)' }]}>
                <MaterialIcons name="savings" size={22} color={COLORS.success} />
              </View>
              <Text style={styles.quickActionLabel}>Goals</Text>
              <MaterialIcons name="chevron-right" size={18} color={COLORS.textMuted} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View style={{ opacity: cardFades[3], transform: [{ translateY: cardSlides[3] }] }}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              style={styles.transactionItem}
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
                <Text style={styles.transactionDesc}>
                  {transaction.description || (transaction.type === 'expense' ? (transaction as any).category : (transaction as any).source)}
                </Text>
                <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
              </View>
              <Text style={[
                styles.transactionAmount,
                transaction.type === 'income' && { color: COLORS.success },
              ]}>
                {transaction.type === 'expense' ? '-' : '+'}
                {transaction.type === 'expense' && (transaction as any).currency
                  ? formatCurrencyWithCode(transaction.amount, (transaction as any).currency)
                  : formatCurrency(transaction.amount)}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* FAB */}
      {fabOpen && (
        <>
          <TouchableOpacity
            style={styles.fabOverlay}
            activeOpacity={1}
            onPress={() => setFabOpen(false)}
          />
          <TouchableOpacity
            style={[styles.fabOption, { bottom: 216 }]}
            activeOpacity={0.85}
            onPress={() => { setFabOpen(false); navigation.navigate('AddIncome'); }}
          >
            <View style={styles.fabOptionLabel}>
              <Text style={styles.fabOptionLabelText}>Income</Text>
            </View>
            <LinearGradient colors={['#00D68F', '#45B7D1']} style={styles.fabOptionGradient}>
              <MaterialIcons name="add" size={22} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fabOption, { bottom: 162 }]}
            activeOpacity={0.85}
            onPress={() => { setFabOpen(false); navigation.navigate('AddExpense'); }}
          >
            <View style={styles.fabOptionLabel}>
              <Text style={styles.fabOptionLabelText}>Expense</Text>
            </View>
            <LinearGradient colors={['#FF6B9D', '#FF8E53']} style={styles.fabOptionGradient}>
              <MaterialIcons name="remove" size={22} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setFabOpen(!fabOpen)}
      >
        <LinearGradient colors={['#6C63FF', '#BB8FCE']} style={styles.fabGradient}>
          <MaterialIcons name={fabOpen ? 'close' : 'add'} size={28} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Income Edit Modal (simple inline) */}
      {editingIncome && (
        <View style={styles.incomeOverlay}>
          <TouchableOpacity
            style={styles.incomeBackdrop}
            activeOpacity={1}
            onPress={() => setEditingIncome(false)}
          />
          <View style={styles.incomeModal}>
            <Text style={styles.incomeModalTitle}>Monthly Income</Text>
            <Text style={styles.incomeModalSubtitle}>
              How much do you earn per month?
            </Text>
            <View style={styles.incomeInputRow}>
              <Text style={styles.incomeInputCurrency}>{currencySymbol}</Text>
              <TextInput
                style={styles.incomeInput}
                value={incomeInput}
                onChangeText={setIncomeInput}
                keyboardType="decimal-pad"
                autoFocus
                selectTextOnFocus
              />
            </View>
            <View style={styles.incomeActions}>
              <TouchableOpacity
                style={styles.incomeCancelBtn}
                onPress={() => setEditingIncome(false)}
              >
                <Text style={styles.incomeCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.incomeSaveBtn} onPress={handleSaveIncome}>
                <LinearGradient
                  colors={['#6C63FF', '#9B59B6']}
                  style={styles.incomeSaveGradient}
                >
                  <Text style={styles.incomeSaveText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Currency Picker Modal */}
      <Modal
        visible={currencyPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCurrencyPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.currencyOverlay}
          activeOpacity={1}
          onPress={() => setCurrencyPickerOpen(false)}
        >
          <View style={styles.currencyModal}>
            <Text style={styles.currencyModalTitle}>Currency</Text>
            <FlatList
              data={CURRENCY_OPTIONS}
              keyExtractor={(item) => item.symbol}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.currencyItem,
                    currencySymbol === item.symbol && styles.currencyItemActive,
                  ]}
                  onPress={() => {
                    setCurrencySymbol(item.symbol);
                    setCurrencyPickerOpen(false);
                  }}
                >
                  <Text style={[
                    styles.currencyItemText,
                    currencySymbol === item.symbol && { color: COLORS.primary },
                  ]}>
                    {item.label}
                  </Text>
                  {currencySymbol === item.symbol && (
                    <MaterialIcons name="check" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Exchange Rate Modal */}
      <Modal
        visible={exchangeRateOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setExchangeRateOpen(false)}
      >
        <TouchableOpacity
          style={styles.currencyOverlay}
          activeOpacity={1}
          onPress={() => setExchangeRateOpen(false)}
        >
          <View style={styles.exchangeRateModal} onStartShouldSetResponder={() => true}>
            <Text style={styles.currencyModalTitle}>Exchange Rates</Text>
            <Text style={styles.exchangeRateSubtitle}>
              Set how many {currencySymbol} (base) per 1 unit of foreign currency
            </Text>

            {/* Existing rates */}
            {exchangeRates.map((er) => (
              <View key={er.from} style={styles.exchangeRateRow}>
                <View style={styles.exchangeRateInfo}>
                  <Text style={styles.exchangeRateCode}>{getCurrencySymbol(er.from)} {er.from}</Text>
                  <Text style={styles.exchangeRateValue}>1 {er.from} = {er.rate} {currencySymbol}</Text>
                </View>
                <TouchableOpacity
                  style={styles.exchangeRateDeleteBtn}
                  onPress={() => deleteExchangeRate(er.from)}
                >
                  <MaterialIcons name="close" size={18} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}

            {exchangeRates.length === 0 && (
              <Text style={styles.exchangeRateEmpty}>
                No exchange rates yet. Add one below to track expenses in other currencies.
              </Text>
            )}

            {/* Add new rate */}
            <View style={styles.exchangeRateAddSection}>
              <Text style={styles.exchangeRateAddLabel}>Add Currency</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.sm }}>
                <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
                  {CURRENCY_OPTIONS
                    .filter((c) => !exchangeRates.some((r) => r.from === c.code))
                    .map((c) => (
                      <TouchableOpacity
                        key={c.code}
                        style={[
                          styles.exchangeRateChip,
                          newRateCurrency === c.code && styles.exchangeRateChipSelected,
                        ]}
                        onPress={() => setNewRateCurrency(c.code)}
                      >
                        <Text style={[
                          styles.exchangeRateChipText,
                          newRateCurrency === c.code && { color: COLORS.primary },
                        ]}>
                          {c.symbol} {c.code}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </ScrollView>

              {newRateCurrency !== '' && (
                <View style={styles.exchangeRateInputRow}>
                  <Text style={styles.exchangeRateInputLabel}>
                    1 {newRateCurrency} =
                  </Text>
                  <TextInput
                    style={styles.exchangeRateInput}
                    value={newRateValue}
                    onChangeText={setNewRateValue}
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.exchangeRateInputLabel}>{currencySymbol}</Text>
                  <TouchableOpacity
                    style={styles.exchangeRateAddBtn}
                    onPress={() => {
                      const val = parseFloat(newRateValue);
                      if (newRateCurrency && !isNaN(val) && val > 0) {
                        addExchangeRate({ from: newRateCurrency, rate: val });
                        setNewRateCurrency('');
                        setNewRateValue('');
                      }
                    }}
                  >
                    <MaterialIcons name="check" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.exchangeRateDoneBtn}
              onPress={() => setExchangeRateOpen(false)}
            >
              <Text style={styles.exchangeRateDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

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
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: FONT_SIZE.xxl,
    color: COLORS.textPrimary,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
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

  // Toggle
  toggleContainer: {
    marginBottom: SPACING.lg,
  },
  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.round,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.round,
    gap: 6,
  },
  toggleBtnActive: {
    overflow: 'hidden',
  },
  toggleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.round,
    gap: 6,
    width: '100%',
  },
  toggleText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  toggleTextActive: {
    fontSize: FONT_SIZE.md,
    color: '#FFF',
    fontWeight: '700',
  },

  // Hero Card
  heroCard: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.glow,
  },
  heroGradient: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    overflow: 'hidden',
    minHeight: 170,
  },
  heroCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  heroCircle1: { width: 200, height: 200, top: -60, right: -40 },
  heroCircle2: { width: 120, height: 120, bottom: -30, left: -20 },
  heroCircle3: { width: 80, height: 80, top: 20, right: 80 },
  heroContent: { zIndex: 1 },
  heroLabel: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  heroAmount: {
    fontSize: 44,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: SPACING.md,
  },
  heroMeta: { flexDirection: 'row' },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
    gap: 6,
  },
  heroMetaText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  sparkleContainer: { position: 'absolute', top: 16, right: 20 },
  sparkle: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 16 },
  sparkle2: { position: 'absolute', top: 20, left: -15, fontSize: 10, color: 'rgba(255, 255, 255, 0.25)' },

  // Summary Cards
  monthlyRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
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

  // Spending Card
  spendingCard: { marginBottom: SPACING.lg },
  spendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  spendingPercent: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.primary,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  spendingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spendingSubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Categories
  categoriesCard: { marginBottom: SPACING.lg },
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
  categoryBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryBarFill: { height: '100%', borderRadius: 2 },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: SPACING.md,
  },

  // Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.1)',
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },

  // Recent Transactions
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

  // Income icon in transactions
  incomeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 96,
    right: SPACING.lg,
    zIndex: 101,
    borderRadius: 29,
  },
  fabGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  fabOption: {
    position: 'absolute',
    right: SPACING.lg,
    zIndex: 101,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  fabOptionLabel: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
  },
  fabOptionLabelText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  fabOptionGradient: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Income Edit Modal
  incomeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  incomeBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  incomeModal: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: '85%',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.large,
  },
  incomeModalTitle: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '800',
    marginBottom: 4,
  },
  incomeModalSubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: SPACING.lg,
  },
  incomeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  incomeInputCurrency: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: '700',
    marginRight: SPACING.sm,
  },
  incomeInput: {
    flex: 1,
    fontSize: 28,
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  incomeActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  incomeCancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  incomeCancelText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  incomeSaveBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  incomeSaveGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  incomeSaveText: {
    fontSize: FONT_SIZE.md,
    color: '#FFF',
    fontWeight: '700',
  },

  // Currency Picker
  currencyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyModal: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    width: '80%',
    maxHeight: '60%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currencyModalTitle: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  currencyItemActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
  },
  currencyItemText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },

  // Exchange Rate Modal
  exchangeRateModal: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exchangeRateSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: SPACING.lg,
  },
  exchangeRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exchangeRateInfo: { flex: 1 },
  exchangeRateCode: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  exchangeRateValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  exchangeRateDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 61, 113, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exchangeRateEmpty: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'center',
    marginVertical: SPACING.lg,
    fontStyle: 'italic',
  },
  exchangeRateAddSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  exchangeRateAddLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  exchangeRateChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exchangeRateChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
  },
  exchangeRateChipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  exchangeRateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  exchangeRateInputLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  exchangeRateInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: 'center',
  },
  exchangeRateAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exchangeRateDoneBtn: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  exchangeRateDoneText: {
    fontSize: FONT_SIZE.md,
    color: '#FFF',
    fontWeight: '700',
  },
});
