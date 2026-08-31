import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useExpenseStore } from '../store/useExpenseStore';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOWS,
} from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  EXPENSE_CATEGORIES,
  Expense,
  ExpenseSplit,
  RecurringFrequency,
} from '../types';
import { getCurrencySymbol } from '../utils/currency';
import { suggestCategory } from '../utils/categorySuggester';
import { scanReceipt } from '../utils/receiptOcr';
import { hasApiKey } from '../assistant/config';
import { useUndoStore } from '../store/useUndoStore';
import { hapticSuccess, hapticError, hapticWarning, hapticLight } from '../utils/haptics';
import {
  AmountInput,
  CurrencySelector,
  CategoryGrid,
  TagsInput,
  SplitTransactions,
  BudgetSelector,
  ReceiptSection,
  DatePickerSection,
  DeleteConfirmModal,
  ConvertToRecurringModal,
  NewCategoryModal,
} from '../components/expense';
import { AccountSelector } from '../components/AccountSelector';

export const AddExpenseScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const editingExpense: Expense | undefined = route.params?.expense;
  const preselectedProjectId: string | undefined = route.params?.projectId;

  const { addExpense, addExpenseWithId, updateExpense, deleteExpense, togglePinExpense, budgets, currencySymbol, customCategories, addCustomCategory, exchangeRates, getOrderedCategories, getAllTags, convertExpenseToRecurring, addExpenseTemplate, expenses: allExpenses } = useExpenseStore();
  const showUndo = useUndoStore((s) => s.show);

  const [amount, setAmount] = useState(editingExpense?.amount?.toString() || '');
  const [category, setCategory] = useState<string>(editingExpense?.category || '');
  const [description, setDescription] = useState(editingExpense?.description || '');
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | undefined>(
    editingExpense?.projectId || preselectedProjectId
  );
  const [isPending, setIsPending] = useState(editingExpense?.isPending ?? false);
  const defaultAccount = useExpenseStore((s) => s.accounts.find((a) => a.isDefault) || s.accounts[0]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    editingExpense?.accountId || defaultAccount?.id || ''
  );
  const [expenseCurrency, setExpenseCurrency] = useState<string | undefined>(editingExpense?.currency);
  const [receiptUri, setReceiptUri] = useState<string | undefined>(editingExpense?.receiptUri);
  const [showReceiptFull, setShowReceiptFull] = useState(false);
  const [date, setDate] = useState(
    editingExpense?.date ? new Date(editingExpense.date) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6C63FF');
  const [newCatIcon, setNewCatIcon] = useState('label');

  // Tags
  const [tags, setTags] = useState<string[]>(editingExpense?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const existingTags = getAllTags().filter((t) => !tags.includes(t));

  // Splits
  const [splits, setSplits] = useState<ExpenseSplit[]>(editingExpense?.splits || []);
  const splitsTotal = splits.reduce((s, x) => s + (x.amount || 0), 0);
  const splitsValid = splits.length === 0 || Math.abs(splitsTotal - (parseFloat(amount) || 0)) < 0.01;

  // Validation
  const [error, setError] = useState('');
  const [templateSaved, setTemplateSaved] = useState(false);

  // Receipt OCR
  const [scanning, setScanning] = useState(false);
  const [apiKeyReady, setApiKeyReady] = useState(false);

  useEffect(() => {
    hasApiKey().then(setApiKeyReady);
  }, []);

  const handleScanReceipt = async () => {
    if (!receiptUri || scanning) return;
    setScanning(true);
    try {
      const result = await scanReceipt(receiptUri);
      if (result.amount) setAmount(result.amount.toString());
      if (result.description) setDescription(result.description);
      if (result.category) setCategory(result.category);
      if (result.date) setDate(new Date(result.date));
    } catch (error: any) {
      let msg = 'Could not scan receipt. Please fill in details manually.';
      if (error.message === 'NO_API_KEY') {
        msg = 'Add your Gemini API key in Settings to use receipt scanning.';
      } else if (error.message === 'RATE_LIMITED') {
        msg = 'Rate limit reached. Please try again in a minute.';
      }
      Alert.alert('Scan Failed', msg);
    } finally {
      setScanning(false);
    }
  };

  // Convert-to-recurring
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertFrequency, setConvertFrequency] = useState<RecurringFrequency>('monthly');

  // Smart category suggestion
  const categorySuggestion = description.length >= 2
    ? suggestCategory(description, allExpenses, customCategories.map((c) => c.name))
    : null;

  const activeBudgets = budgets.filter((p) => p.status === 'active');
  const orderedCategories = getOrderedCategories();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const amountScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAmountFocus = () => {
    Animated.spring(amountScale, {
      toValue: 1.05,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleAmountBlur = () => {
    Animated.spring(amountScale, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleSave = () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      hapticError();
      return;
    }
    if (!category) {
      setError('Please select a category');
      hapticError();
      return;
    }
    if (splits.length > 0 && !splitsValid) {
      Alert.alert(
        'Splits Don\'t Match',
        `Split total (${splitsTotal.toFixed(2)}) must equal the expense amount (${parseFloat(amount).toFixed(2)}).`
      );
      return;
    }

    const expenseData = {
      amount: parseFloat(amount),
      category,
      description,
      date: date.toISOString(),
      isFixed: false,
      projectId: selectedBudgetId,
      isPending: selectedBudgetId ? isPending : false,
      currency: expenseCurrency,
      receiptUri,
      tags: tags.length > 0 ? tags : undefined,
      splits: splits.length > 0 ? splits : undefined,
      accountId: selectedAccountId || undefined,
    };

    if (editingExpense) {
      const previousState = { ...editingExpense };
      updateExpense(editingExpense.id, expenseData);
      showUndo({
        message: 'Expense updated',
        entityType: 'expense',
        restore: () => updateExpense(editingExpense.id, previousState),
      });
    } else {
      addExpense(expenseData);
    }

    hapticSuccess();
    navigation.goBack();
  };

  const handleConvertToRecurring = () => {
    if (!editingExpense) return;
    convertExpenseToRecurring(editingExpense.id, convertFrequency);
    setShowConvertModal(false);
    navigation.goBack();
  };

  const handleDelete = () => {
    if (editingExpense) {
      const snapshot = editingExpense;
      deleteExpense(editingExpense.id);
      hapticWarning();
      showUndo({
        message: 'Expense deleted',
        entityType: 'expense',
        restore: () => addExpenseWithId(snapshot),
      });
      navigation.goBack();
    }
  };

  const handleSaveAsTemplate = () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Enter a valid amount to save as template');
      hapticError();
      return;
    }
    if (!category) {
      setError('Select a category to save as template');
      hapticError();
      return;
    }
    hapticSuccess();
    const name = description.trim() || category;
    addExpenseTemplate({
      name,
      amount: parseFloat(amount),
      category,
      description: description.trim(),
      currency: expenseCurrency,
      tags: tags.length > 0 ? tags : undefined,
      icon: 'bolt',
    });
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 2000);
  };

  const handleSaveNewCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    const exists = EXPENSE_CATEGORIES.includes(trimmed as any) ||
      customCategories.some((c) => c.name === trimmed);
    if (exists) return;
    addCustomCategory({ name: trimmed, icon: newCatIcon, color: newCatColor });
    setCategory(trimmed);
    setNewCatName('');
    setNewCatIcon('label');
    setNewCatColor('#6C63FF');
    setShowNewCategory(false);
  };

  const displayCurrencySymbol = expenseCurrency ? getCurrencySymbol(expenseCurrency) : currencySymbol;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {editingExpense ? 'Edit Expense' : 'New Expense'}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <AmountInput
            amount={amount}
            setAmount={(val: string) => { setError(''); setAmount(val); }}
            currencySymbol={displayCurrencySymbol}
            fadeAnim={fadeAnim}
            amountScale={amountScale}
            onFocus={handleAmountFocus}
            onBlur={handleAmountBlur}
          />
          {error ? <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4, textAlign: 'center' }}>{error}</Text> : null}

          <CurrencySelector
            exchangeRates={exchangeRates}
            expenseCurrency={expenseCurrency}
            setExpenseCurrency={setExpenseCurrency}
            currencySymbol={currencySymbol}
            fadeAnim={fadeAnim}
            slideAnim={slideAnim}
          />

          <CategoryGrid
            category={category}
            setCategory={setCategory}
            orderedCategories={orderedCategories}
            customCategories={customCategories}
            onAddCustom={() => setShowNewCategory(true)}
            fadeAnim={fadeAnim}
            slideAnim={slideAnim}
            suggestion={categorySuggestion}
          />

          {/* Description */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Description</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="notes" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.textInput, { color: colors.textPrimary }]}
                value={description}
                onChangeText={setDescription}
                placeholder="What was this expense for?"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={200}
              />
            </View>
          </Animated.View>

          <DatePickerSection
            date={date}
            setDate={setDate}
            showDatePicker={showDatePicker}
            setShowDatePicker={setShowDatePicker}
            fadeAnim={fadeAnim}
            slideAnim={slideAnim}
          />

          <ReceiptSection
            receiptUri={receiptUri}
            setReceiptUri={setReceiptUri}
            showReceiptFull={showReceiptFull}
            setShowReceiptFull={setShowReceiptFull}
            fadeAnim={fadeAnim}
            slideAnim={slideAnim}
            onScanReceipt={apiKeyReady ? handleScanReceipt : undefined}
            scanning={scanning}
          />

          <AccountSelector
            selectedAccountId={selectedAccountId}
            onSelect={setSelectedAccountId}
          />

          <BudgetSelector
            selectedBudgetId={selectedBudgetId}
            setSelectedBudgetId={setSelectedBudgetId}
            isPending={isPending}
            setIsPending={setIsPending}
            activeBudgets={activeBudgets}
            fadeAnim={fadeAnim}
            slideAnim={slideAnim}
          />

          <TagsInput
            tags={tags}
            setTags={setTags}
            tagInput={tagInput}
            setTagInput={setTagInput}
            existingTags={existingTags}
            fadeAnim={fadeAnim}
            slideAnim={slideAnim}
          />

          <SplitTransactions
            splits={splits}
            setSplits={setSplits}
            amount={amount}
            orderedCategories={orderedCategories}
            customCategories={customCategories}
            activeBudgets={activeBudgets}
            currencySymbol={displayCurrencySymbol}
            fadeAnim={fadeAnim}
            slideAnim={slideAnim}
          />

          {/* Save as Template */}
          {!editingExpense && (
            <TouchableOpacity
              style={[styles.convertBtn, { borderColor: `${colors.warning}4D`, backgroundColor: `${colors.warning}14` }]}
              activeOpacity={0.8}
              onPress={handleSaveAsTemplate}
            >
              <MaterialIcons name={templateSaved ? 'check-circle' : 'bolt'} size={20} color={colors.warning} />
              <Text style={[styles.convertBtnText, { color: colors.warning }]}>
                {templateSaved ? 'Template Saved!' : 'Save as Template'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Pin/Unpin (edit mode only) */}
          {editingExpense && !editingExpense.isFixed && (
            <TouchableOpacity
              style={[styles.convertBtn, { borderColor: `${colors.warning}4D`, backgroundColor: `${colors.warning}14` }]}
              activeOpacity={0.8}
              onPress={() => {
                togglePinExpense(editingExpense.id);
                hapticLight();
                navigation.goBack();
              }}
            >
              <MaterialIcons name={editingExpense.pinned ? 'push-pin' : 'push-pin'} size={20} color={colors.warning} />
              <Text style={[styles.convertBtnText, { color: colors.warning }]}>
                {editingExpense.pinned ? 'Unpin Expense' : 'Pin to Top'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Convert to Recurring (edit mode only) */}
          {editingExpense && (
            <TouchableOpacity
              style={[styles.convertBtn, { borderColor: `${colors.primary}4D`, backgroundColor: `${colors.primary}14` }]}
              activeOpacity={0.8}
              onPress={() => setShowConvertModal(true)}
            >
              <MaterialIcons name="autorenew" size={20} color={colors.primary} />
              <Text style={[styles.convertBtnText, { color: colors.primary }]}>Convert to Recurring</Text>
            </TouchableOpacity>
          )}

          {/* Delete Button (inside scroll) */}
          {editingExpense && (
            <TouchableOpacity
              style={[styles.deleteBtn, { borderColor: `${colors.danger}4D`, backgroundColor: `${colors.danger}14` }]}
              activeOpacity={0.8}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <MaterialIcons name="delete-outline" size={20} color={colors.danger} />
              <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Delete Expense</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Button */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.saveBtn}
          activeOpacity={0.8}
          onPress={handleSave}
        >
          <LinearGradient
            colors={['#6C63FF', '#9B59B6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            <MaterialIcons name="check" size={22} color="#FFF" />
            <Text style={styles.saveBtnText}>
              {editingExpense ? 'Update Expense' : 'Add Expense'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <DeleteConfirmModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onDelete={handleDelete}
      />

      <ConvertToRecurringModal
        visible={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        convertFrequency={convertFrequency}
        setConvertFrequency={setConvertFrequency}
        onConvert={handleConvertToRecurring}
      />

      <NewCategoryModal
        visible={showNewCategory}
        onClose={() => setShowNewCategory(false)}
        newCatName={newCatName}
        setNewCatName={setNewCatName}
        newCatIcon={newCatIcon}
        setNewCatIcon={setNewCatIcon}
        newCatColor={newCatColor}
        setNewCatColor={setNewCatColor}
        onSave={handleSaveNewCategory}
      />
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
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
  },

  // Description
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
    paddingVertical: 4,
    minHeight: 24,
  },

  // Convert to Recurring
  convertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
    gap: SPACING.sm,
  },
  convertBtnText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Delete Button
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 61, 113, 0.3)',
    backgroundColor: 'rgba(255, 61, 113, 0.08)',
    gap: SPACING.sm,
  },
  deleteBtnText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.danger,
    fontWeight: '600',
  },

  // Save Button
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    paddingBottom: 36,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(108, 99, 255, 0.08)',
  },
  saveBtn: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  saveBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md + 2,
    gap: SPACING.sm,
  },
  saveBtnText: {
    fontSize: FONT_SIZE.lg,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
