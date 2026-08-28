import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { CategoryIcon } from '../components/CategoryIcon';
import { useExpenseStore } from '../store/useExpenseStore';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOWS,
} from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import {
  EXPENSE_CATEGORIES,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  ExpenseCategory,
  FixedExpense,
  FixedIncome,
  INCOME_SOURCES,
  INCOME_SOURCE_ICONS,
  INCOME_SOURCE_COLORS,
  RecurringFrequency,
  FREQUENCY_OPTIONS,
  FREQUENCY_TO_MONTHLY,
} from '../types';
import { formatCurrency } from '../utils/currency';

type Tab = 'expenses' | 'income';

export const FixedExpensesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const highlightId: string | undefined = route.params?.highlightId;
  const {
    fixedExpenses,
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    getFixedExpensesTotal,
    fixedIncomes,
    addFixedIncome,
    updateFixedIncome,
    deleteFixedIncome,
    getFixedIncomesTotal,
    customCategories,
    getOrderedCategories,
  } = useExpenseStore();

  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [editingIncome, setEditingIncome] = useState<FixedIncome | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [source, setSource] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const [highlightedItemId, setHighlightedItemId] = useState<string | undefined>(highlightId);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const expenseTotal = getFixedExpensesTotal();
  const incomeTotal = getFixedIncomesTotal();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Auto-switch tab and clear highlight after delay
  useEffect(() => {
    if (highlightId) {
      const isIncome = fixedIncomes.some((i) => i.id === highlightId);
      if (isIncome) setActiveTab('income');
      else setActiveTab('expenses');
      const timer = setTimeout(() => setHighlightedItemId(undefined), 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightId]);

  const openExpenseModal = (item?: FixedExpense) => {
    setError('');
    setEditingIncome(null);
    if (item) {
      setEditingExpense(item);
      setAmount(item.amount.toString());
      setCategory(item.category);
      setDescription(item.description);
      setFrequency(item.frequency || 'monthly');
    } else {
      setEditingExpense(null);
      setAmount('');
      setCategory('');
      setDescription('');
      setFrequency('monthly');
    }
    setModalVisible(true);
  };

  const openIncomeModal = (item?: FixedIncome) => {
    setError('');
    setEditingExpense(null);
    if (item) {
      setEditingIncome(item);
      setAmount(item.amount.toString());
      setSource(item.source);
      setDescription(item.description);
      setFrequency(item.frequency || 'monthly');
    } else {
      setEditingIncome(null);
      setAmount('');
      setSource('');
      setDescription('');
      setFrequency('monthly');
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (activeTab === 'expenses' || editingExpense) {
      if (!category) {
        setError('Please select a category');
        return;
      }
      const data = { amount: parseFloat(amount), category, description, frequency };
      if (editingExpense) {
        updateFixedExpense(editingExpense.id, data);
      } else {
        addFixedExpense(data);
      }
    } else {
      if (!source) {
        setError('Please select a source');
        return;
      }
      const data = { amount: parseFloat(amount), source, description, frequency };
      if (editingIncome) {
        updateFixedIncome(editingIncome.id, data);
      } else {
        addFixedIncome(data);
      }
    }
    setModalVisible(false);
  };

  const isEditingExpenseModal = editingExpense !== null || (activeTab === 'expenses' && editingIncome === null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Recurring</Text>
        <TouchableOpacity
          style={[styles.addBtn, { marginRight: SPACING.sm }]}
          onPress={() => navigation.navigate('BillCalendar')}
        >
          <View style={[styles.addBtnGradient, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
            <MaterialIcons name="calendar-month" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => activeTab === 'expenses' ? openExpenseModal() : openIncomeModal()}
        >
          <LinearGradient
            colors={activeTab === 'expenses' ? ['#FF6B9D', '#FF8E53'] : ['#00D68F', '#45B7D1']}
            style={styles.addBtnGradient}
          >
            <MaterialIcons name="add" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Tab Toggle */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && styles.tabActiveExpense]}
          onPress={() => setActiveTab('expenses')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'expenses' }}
          accessibilityLabel="Recurring expenses"
        >
          <MaterialIcons
            name="trending-down"
            size={16}
            color={activeTab === 'expenses' ? colors.accent : colors.textMuted}
          />
          <Text style={[styles.tabText, { color: colors.textMuted }, activeTab === 'expenses' && styles.tabTextActiveExpense]}>
            Expenses
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'income' && styles.tabActiveIncome]}
          onPress={() => setActiveTab('income')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'income' }}
          accessibilityLabel="Recurring income"
        >
          <MaterialIcons
            name="trending-up"
            size={16}
            color={activeTab === 'income' ? colors.success : colors.textMuted}
          />
          <Text style={[styles.tabText, { color: colors.textMuted }, activeTab === 'income' && styles.tabTextActiveIncome]}>
            Income
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'expenses' ? (
          <>
            {/* Expense Total Card */}
            <GlassCard style={styles.totalCard} glowColor={COLORS.accent} intensity="medium">
              <View style={styles.totalRow}>
                <View>
                  <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Monthly Expenses</Text>
                  <Text style={[styles.totalAmount, { color: colors.textPrimary }]}>{formatCurrency(expenseTotal)}</Text>
                </View>
                <View style={[styles.totalIcon, { backgroundColor: 'rgba(255, 107, 157, 0.12)', borderColor: 'rgba(255, 107, 157, 0.2)' }]}>
                  <MaterialIcons name="trending-down" size={28} color={COLORS.accent} />
                </View>
              </View>
              <View style={[styles.totalMeta, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : `${colors.border}40` }]}>
                <View style={styles.totalMetaItem}>
                  <Text style={[styles.totalMetaNum, { color: colors.textPrimary }]}>{fixedExpenses.length}</Text>
                  <Text style={[styles.totalMetaLabel, { color: colors.textMuted }]}>Active</Text>
                </View>
                <View style={[styles.totalMetaDivider, { backgroundColor: colors.border }]} />
                <View style={styles.totalMetaItem}>
                  <Text style={[styles.totalMetaNum, { color: colors.textPrimary }]}>{formatCurrency(expenseTotal * 12)}</Text>
                  <Text style={[styles.totalMetaLabel, { color: colors.textMuted }]}>Yearly</Text>
                </View>
              </View>
            </GlassCard>

            {/* Fixed Expense Items */}
            {fixedExpenses.map((item) => {
              const customCat = customCategories.find((c) => c.name === item.category);
              const color = customCat?.color || CATEGORY_COLORS[item.category as ExpenseCategory] || '#AEB6BF';
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.listItem,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    item.paused && { opacity: 0.55 },
                    highlightedItemId === item.id && { borderColor: colors.primary, borderWidth: 2, backgroundColor: `${colors.primary}12` },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => openExpenseModal(item)}
                >
                  <CategoryIcon category={item.category} size={48} />
                  <View style={styles.listItemInfo}>
                    <Text style={[styles.listItemDesc, { color: colors.textPrimary }]}>{item.description}</Text>
                    <View style={styles.listItemTagRow}>
                      <View style={[styles.listItemTag, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
                        <Text style={[styles.listItemTagText, { color }]}>{item.category}</Text>
                      </View>
                      <View style={[styles.listItemTag, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : `${colors.border}40`, borderColor: colors.border }]}>
                        <MaterialIcons name="autorenew" size={10} color={colors.textMuted} />
                        <Text style={[styles.listItemTagText, { color: colors.textMuted }]}>
                          {FREQUENCY_OPTIONS.find((f) => f.value === (item.frequency || 'monthly'))?.label || 'Monthly'}
                        </Text>
                      </View>
                      {item.paused && (
                        <View style={[styles.listItemTag, { backgroundColor: 'rgba(255, 170, 0, 0.12)', borderColor: 'rgba(255, 170, 0, 0.3)' }]}>
                          <MaterialIcons name="pause" size={10} color="#FFAA00" />
                          <Text style={[styles.listItemTagText, { color: '#FFAA00' }]}>Paused</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={[styles.listItemAmount, { color: colors.accent }]}>{formatCurrency(item.amount)}</Text>
                    <Text style={[styles.listItemPer, { color: colors.textMuted }]}>
                      /{FREQUENCY_OPTIONS.find((f) => f.value === (item.frequency || 'monthly'))?.shortLabel.toLowerCase() || 'month'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {fixedExpenses.length === 0 && (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <MaterialIcons name="autorenew" size={48} color={colors.textMuted} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No recurring expenses</Text>
                <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                  Track bills, subscriptions, and rent that repeat on a schedule.{'\n'}Tap the + button below to add your first one, or convert a one-time expense from the Expenses tab.
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Income Total Card */}
            <GlassCard style={styles.totalCard} glowColor={COLORS.success} intensity="medium">
              <View style={styles.totalRow}>
                <View>
                  <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Monthly Income</Text>
                  <Text style={[styles.totalAmount, { color: colors.textPrimary }]}>{formatCurrency(incomeTotal)}</Text>
                </View>
                <View style={[styles.totalIcon, { backgroundColor: 'rgba(0, 214, 143, 0.12)', borderColor: 'rgba(0, 214, 143, 0.2)' }]}>
                  <MaterialIcons name="trending-up" size={28} color={COLORS.success} />
                </View>
              </View>
              <View style={[styles.totalMeta, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : `${colors.border}40` }]}>
                <View style={styles.totalMetaItem}>
                  <Text style={[styles.totalMetaNum, { color: colors.textPrimary }]}>{fixedIncomes.length}</Text>
                  <Text style={[styles.totalMetaLabel, { color: colors.textMuted }]}>Sources</Text>
                </View>
                <View style={[styles.totalMetaDivider, { backgroundColor: colors.border }]} />
                <View style={styles.totalMetaItem}>
                  <Text style={[styles.totalMetaNum, { color: colors.textPrimary }]}>{formatCurrency(incomeTotal * 12)}</Text>
                  <Text style={[styles.totalMetaLabel, { color: colors.textMuted }]}>Yearly</Text>
                </View>
              </View>
            </GlassCard>

            {/* Fixed Income Items */}
            {fixedIncomes.map((item) => {
              const color = INCOME_SOURCE_COLORS[item.source as keyof typeof INCOME_SOURCE_COLORS] || '#00D68F';
              const icon = INCOME_SOURCE_ICONS[item.source as keyof typeof INCOME_SOURCE_ICONS] || 'attach-money';
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.listItem,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    item.paused && { opacity: 0.55 },
                    highlightedItemId === item.id && { borderColor: colors.success, borderWidth: 2, backgroundColor: `${colors.success}12` },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => openIncomeModal(item)}
                >
                  <View style={[styles.incomeIcon, { backgroundColor: `${color}18`, borderColor: `${color}30` }]}>
                    <MaterialIcons name={icon as any} size={24} color={color} />
                  </View>
                  <View style={styles.listItemInfo}>
                    <Text style={[styles.listItemDesc, { color: colors.textPrimary }]}>{item.description}</Text>
                    <View style={styles.listItemTagRow}>
                      <View style={[styles.listItemTag, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
                        <Text style={[styles.listItemTagText, { color }]}>{item.source}</Text>
                      </View>
                      <View style={[styles.listItemTag, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : `${colors.border}40`, borderColor: colors.border }]}>
                        <MaterialIcons name="autorenew" size={10} color={colors.textMuted} />
                        <Text style={[styles.listItemTagText, { color: colors.textMuted }]}>
                          {FREQUENCY_OPTIONS.find((f) => f.value === (item.frequency || 'monthly'))?.label || 'Monthly'}
                        </Text>
                      </View>
                      {item.paused && (
                        <View style={[styles.listItemTag, { backgroundColor: 'rgba(255, 170, 0, 0.12)', borderColor: 'rgba(255, 170, 0, 0.3)' }]}>
                          <MaterialIcons name="pause" size={10} color="#FFAA00" />
                          <Text style={[styles.listItemTagText, { color: '#FFAA00' }]}>Paused</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={[styles.listItemAmount, { color: colors.success }]}>{formatCurrency(item.amount)}</Text>
                    <Text style={[styles.listItemPer, { color: colors.textMuted }]}>
                      /{FREQUENCY_OPTIONS.find((f) => f.value === (item.frequency || 'monthly'))?.shortLabel.toLowerCase() || 'month'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {fixedIncomes.length === 0 && (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <MaterialIcons name="account-balance" size={48} color={colors.textMuted} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No recurring income</Text>
                <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                  Track salary, freelance retainers, rental income, or dividends.{'\n'}Tap + to add, or convert a one-time income from the Income tab.
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={[styles.modalCancel, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {isEditingExpenseModal
                ? `${editingExpense ? 'Edit' : 'New'} Recurring Expense`
                : `${editingIncome ? 'Edit' : 'New'} Recurring Income`}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Amount */}
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Amount</Text>
            <View style={styles.modalAmountRow}>
              <Text style={[styles.modalCurrency, { color: colors.primary }]}>$</Text>
              <TextInput
                style={[styles.modalAmountInput, { color: colors.textPrimary }]}
                value={amount}
                onChangeText={(val) => { setError(''); setAmount(val); }}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            {error ? <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4, textAlign: 'center' }}>{error}</Text> : null}

            {/* Description */}
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Description</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              value={description}
              onChangeText={setDescription}
              placeholder={isEditingExpenseModal ? 'e.g., Netflix subscription' : 'e.g., Monthly salary'}
              placeholderTextColor={colors.textMuted}
              maxLength={200}
            />

            {/* Frequency */}
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Frequency</Text>
            <View style={styles.frequencyRow}>
              {FREQUENCY_OPTIONS.map((opt) => {
                const isSelected = frequency === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.frequencyChip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isSelected && [styles.frequencyChipActive, { borderColor: colors.primary, backgroundColor: `${colors.primary}15` }],
                    ]}
                    onPress={() => setFrequency(opt.value)}
                  >
                    <Text style={[
                      styles.frequencyChipText,
                      { color: colors.textMuted },
                      isSelected && [styles.frequencyChipTextActive, { color: colors.primary }],
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {isEditingExpenseModal ? (
              <>
                {/* Category */}
                <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Category</Text>
                <View style={styles.modalChipGrid}>
                  {getOrderedCategories().map((cat) => {
                    const isSelected = category === cat;
                    const custom = customCategories.find((c) => c.name === cat);
                    const color = custom?.color || CATEGORY_COLORS[cat as ExpenseCategory] || '#AEB6BF';
                    const icon = custom?.icon || CATEGORY_ICONS[cat as ExpenseCategory] || 'more-horiz';
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.modalChip,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          isSelected && { borderColor: color, backgroundColor: `${color}15` },
                        ]}
                        onPress={() => setCategory(cat)}
                      >
                        <MaterialIcons
                          name={icon as any}
                          size={20}
                          color={isSelected ? color : colors.textMuted}
                        />
                        <Text style={[styles.modalChipText, { color: colors.textSecondary }, isSelected && { color }]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : (
              <>
                {/* Source */}
                <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Source</Text>
                <View style={styles.modalChipGrid}>
                  {INCOME_SOURCES.map((s) => {
                    const isSelected = source === s;
                    const color = INCOME_SOURCE_COLORS[s];
                    const icon = INCOME_SOURCE_ICONS[s];
                    return (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.modalChip,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          isSelected && { borderColor: color, backgroundColor: `${color}15` },
                        ]}
                        onPress={() => setSource(s)}
                      >
                        <MaterialIcons
                          name={icon as any}
                          size={20}
                          color={isSelected ? color : colors.textMuted}
                        />
                        <Text style={[styles.modalChipText, { color: colors.textSecondary }, isSelected && { color }]}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Pause / Resume button */}
            {(editingExpense || editingIncome) && (
              <TouchableOpacity
                style={[styles.modalDeleteBtn, { marginTop: SPACING.lg, marginBottom: 0 }]}
                onPress={() => {
                  if (editingExpense) {
                    updateFixedExpense(editingExpense.id, { paused: !editingExpense.paused });
                    setEditingExpense({ ...editingExpense, paused: !editingExpense.paused });
                  } else if (editingIncome) {
                    updateFixedIncome(editingIncome.id, { paused: !editingIncome.paused });
                    setEditingIncome({ ...editingIncome, paused: !editingIncome.paused });
                  }
                }}
              >
                <MaterialIcons
                  name={(editingExpense?.paused || editingIncome?.paused) ? 'play-arrow' : 'pause'}
                  size={20}
                  color={COLORS.warning}
                />
                <Text style={[styles.modalDeleteText, { color: COLORS.warning }]}>
                  {(editingExpense?.paused || editingIncome?.paused) ? 'Resume' : 'Pause'} {editingExpense ? 'Expense' : 'Income'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Delete button */}
            {(editingExpense || editingIncome) && (
              <TouchableOpacity
                style={styles.modalDeleteBtn}
                onPress={() => setShowDeleteConfirm(true)}
              >
                <MaterialIcons name="delete-outline" size={20} color={COLORS.danger} />
                <Text style={styles.modalDeleteText}>
                  Delete {editingExpense ? 'Expense' : 'Income'}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <TouchableOpacity
          style={styles.deleteOverlay}
          activeOpacity={1}
          onPress={() => setShowDeleteConfirm(false)}
        >
          <View style={[styles.deleteContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.deleteTitle, { color: colors.textPrimary }]}>
              Delete {editingExpense ? 'Recurring Expense' : 'Recurring Income'}
            </Text>
            <Text style={[styles.deleteMessage, { color: colors.textSecondary }]}>Are you sure? This cannot be undone.</Text>
            <View style={styles.deleteButtons}>
              <TouchableOpacity
                style={[styles.deleteCancelBtn, { backgroundColor: colors.background }]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={[styles.deleteCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={() => {
                  if (editingExpense) {
                    deleteFixedExpense(editingExpense.id);
                  } else if (editingIncome) {
                    deleteFixedIncome(editingIncome.id);
                  }
                  setShowDeleteConfirm(false);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.deleteConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    color: COLORS.textPrimary,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  addBtn: {
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  addBtnGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tab Toggle
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.sm,
    gap: 6,
  },
  tabActiveExpense: {
    backgroundColor: 'rgba(255, 107, 157, 0.12)',
  },
  tabActiveIncome: {
    backgroundColor: 'rgba(0, 214, 143, 0.12)',
  },
  tabText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  tabTextActiveExpense: {
    color: COLORS.accent,
  },
  tabTextActiveIncome: {
    color: COLORS.success,
  },

  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },

  // Total Card
  totalCard: {
    marginBottom: SPACING.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  totalLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: FONT_SIZE.xxxl,
    color: COLORS.textPrimary,
    fontWeight: '800',
    letterSpacing: -1,
  },
  totalIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  totalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  totalMetaItem: {
    flex: 1,
    alignItems: 'center',
  },
  totalMetaNum: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  totalMetaLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  totalMetaDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },

  // List Items
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 33, 62, 0.6)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.06)',
    gap: SPACING.md,
  },
  incomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemDesc: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: 6,
  },
  listItemTagRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  listItemTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  listItemTagText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  listItemAmount: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  listItemPer: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
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
    maxWidth: 260,
  },

  // Modal
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
  modalSave: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '700',
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
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  modalAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCurrency: {
    fontSize: 32,
    color: COLORS.primary,
    fontWeight: '700',
    marginRight: 4,
  },
  modalAmountInput: {
    fontSize: 40,
    color: COLORS.textPrimary,
    fontWeight: '800',
    flex: 1,
    paddingVertical: 4,
  },
  modalInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 24,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  frequencyChip: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  frequencyChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}15`,
  },
  frequencyChipText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  frequencyChipTextActive: {
    color: COLORS.primary,
  },
  modalChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  modalChip: {
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
  modalChipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modalDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    marginTop: SPACING.xl,
    gap: SPACING.xs,
  },
  modalDeleteText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.danger,
    fontWeight: '600',
  },

  // Delete Confirmation
  deleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '80%',
    maxWidth: 340,
  },
  deleteTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  deleteMessage: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  deleteButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
  },
  deleteCancelBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  deleteCancelText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  deleteConfirmBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 61, 113, 0.12)',
  },
  deleteConfirmText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.danger,
  },
});
