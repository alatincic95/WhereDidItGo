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
  Modal,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
import {
  EXPENSE_CATEGORIES,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  ExpenseCategory,
  Expense,
  CustomCategory,
} from '../types';
import { getCurrencySymbol } from '../utils/currency';

export const AddExpenseScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editingExpense: Expense | undefined = route.params?.expense;
  const preselectedProjectId: string | undefined = route.params?.projectId;

  const { addExpense, updateExpense, deleteExpense, budgets, currencySymbol, customCategories, addCustomCategory, exchangeRates } = useExpenseStore();

  const [amount, setAmount] = useState(editingExpense?.amount?.toString() || '');
  const [category, setCategory] = useState<string>(editingExpense?.category || '');
  const [description, setDescription] = useState(editingExpense?.description || '');
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | undefined>(
    editingExpense?.projectId || preselectedProjectId
  );
  const [isPending, setIsPending] = useState(editingExpense?.isPending ?? false);
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

  const activeBudgets = budgets.filter((p) => p.status === 'active');

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
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    if (!category) {
      Alert.alert('Select Category', 'Please select a category');
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
    };

    if (editingExpense) {
      updateExpense(editingExpense.id, expenseData);
    } else {
      addExpense(expenseData);
    }

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editingExpense ? 'Edit Expense' : 'New Expense'}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Amount Input */}
          <Animated.View
            style={[
              styles.amountSection,
              {
                opacity: fadeAnim,
                transform: [{ scale: amountScale }],
              },
            ]}
          >
            <Text style={styles.amountLabel}>Amount</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>
                {expenseCurrency ? getCurrencySymbol(expenseCurrency) : currencySymbol}
              </Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
                onFocus={handleAmountFocus}
                onBlur={handleAmountBlur}
              />
            </View>
            <View style={styles.amountLine}>
              <LinearGradient
                colors={['#6C63FF', '#BB8FCE', '#FF6B9D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.amountLineGradient}
              />
            </View>
          </Animated.View>

          {/* Currency Selector (only when exchange rates are configured) */}
          {exchangeRates.length > 0 && (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <Text style={styles.sectionLabel}>Currency</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: SPACING.md }}
              >
                <TouchableOpacity
                  style={[
                    styles.currencyChip,
                    !expenseCurrency && styles.currencyChipSelected,
                  ]}
                  onPress={() => setExpenseCurrency(undefined)}
                >
                  <Text
                    style={[
                      styles.currencyChipText,
                      !expenseCurrency && styles.currencyChipTextSelected,
                    ]}
                  >
                    {currencySymbol} Base
                  </Text>
                </TouchableOpacity>
                {exchangeRates.map((er) => {
                  const isSelected = expenseCurrency === er.from;
                  return (
                    <TouchableOpacity
                      key={er.from}
                      style={[
                        styles.currencyChip,
                        isSelected && styles.currencyChipSelected,
                      ]}
                      onPress={() => setExpenseCurrency(er.from)}
                    >
                      <Text
                        style={[
                          styles.currencyChipText,
                          isSelected && styles.currencyChipTextSelected,
                        ]}
                      >
                        {getCurrencySymbol(er.from)} {er.from}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Animated.View>
          )}

          {/* Category Selector */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {EXPENSE_CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                const color = CATEGORY_COLORS[cat];
                const icon = CATEGORY_ICONS[cat];

                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryItem,
                      isSelected && {
                        borderColor: color,
                        backgroundColor: `${color}15`,
                      },
                    ]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.categoryIconWrap,
                        {
                          backgroundColor: isSelected ? `${color}25` : 'rgba(255,255,255,0.04)',
                        },
                      ]}
                    >
                      <MaterialIcons
                        name={icon as any}
                        size={22}
                        color={isSelected ? color : COLORS.textMuted}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryText,
                        isSelected && { color },
                      ]}
                    >
                      {cat}
                    </Text>
                    {isSelected && (
                      <View style={[styles.selectedDot, { backgroundColor: color }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
              {customCategories.map((cc) => {
                const isSelected = category === cc.name;
                return (
                  <TouchableOpacity
                    key={cc.name}
                    style={[
                      styles.categoryItem,
                      isSelected && {
                        borderColor: cc.color,
                        backgroundColor: `${cc.color}15`,
                      },
                    ]}
                    onPress={() => setCategory(cc.name)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.categoryIconWrap,
                        {
                          backgroundColor: isSelected ? `${cc.color}25` : 'rgba(255,255,255,0.04)',
                        },
                      ]}
                    >
                      <MaterialIcons
                        name={cc.icon as any}
                        size={22}
                        color={isSelected ? cc.color : COLORS.textMuted}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryText,
                        isSelected && { color: cc.color },
                      ]}
                    >
                      {cc.name}
                    </Text>
                    {isSelected && (
                      <View style={[styles.selectedDot, { backgroundColor: cc.color }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
              {/* Add Custom Category */}
              <TouchableOpacity
                style={styles.categoryItem}
                onPress={() => setShowNewCategory(true)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.categoryIconWrap,
                    { backgroundColor: 'rgba(255,255,255,0.04)' },
                  ]}
                >
                  <MaterialIcons name="add" size={22} color={COLORS.textMuted} />
                </View>
                <Text style={styles.categoryText}>Custom</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Description */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text style={styles.sectionLabel}>Description</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="notes" size={20} color={COLORS.textMuted} />
              <TextInput
                style={styles.textInput}
                value={description}
                onChangeText={setDescription}
                placeholder="What was this expense for?"
                placeholderTextColor={COLORS.textMuted}
                multiline
              />
            </View>
          </Animated.View>

          {/* Date */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text style={styles.sectionLabel}>Date</Text>
            <TouchableOpacity
              style={styles.inputContainer}
              activeOpacity={0.7}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons name="calendar-today" size={20} color={COLORS.textMuted} />
              <Text style={styles.dateText}>
                {date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Receipt Photo */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text style={styles.sectionLabel}>Receipt (optional)</Text>
            {receiptUri ? (
              <View style={styles.receiptPreviewContainer}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowReceiptFull(true)}
                >
                  <Image source={{ uri: receiptUri }} style={styles.receiptPreview} />
                </TouchableOpacity>
                <View style={styles.receiptActions}>
                  <TouchableOpacity
                    style={styles.receiptActionBtn}
                    onPress={async () => {
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ['images'],
                        quality: 0.7,
                        allowsEditing: true,
                      });
                      if (!result.canceled && result.assets[0]) {
                        setReceiptUri(result.assets[0].uri);
                      }
                    }}
                  >
                    <MaterialIcons name="swap-horiz" size={18} color={COLORS.primary} />
                    <Text style={styles.receiptActionText}>Replace</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.receiptActionBtn}
                    onPress={() => setReceiptUri(undefined)}
                  >
                    <MaterialIcons name="close" size={18} color={COLORS.danger} />
                    <Text style={[styles.receiptActionText, { color: COLORS.danger }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.receiptButtonRow}>
                <TouchableOpacity
                  style={styles.receiptBtn}
                  activeOpacity={0.7}
                  onPress={async () => {
                    const result = await ImagePicker.launchCameraAsync({
                      quality: 0.7,
                      allowsEditing: true,
                    });
                    if (!result.canceled && result.assets[0]) {
                      setReceiptUri(result.assets[0].uri);
                    }
                  }}
                >
                  <MaterialIcons name="camera-alt" size={22} color={COLORS.textMuted} />
                  <Text style={styles.receiptBtnText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.receiptBtn}
                  activeOpacity={0.7}
                  onPress={async () => {
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ['images'],
                      quality: 0.7,
                      allowsEditing: true,
                    });
                    if (!result.canceled && result.assets[0]) {
                      setReceiptUri(result.assets[0].uri);
                    }
                  }}
                >
                  <MaterialIcons name="photo-library" size={22} color={COLORS.textMuted} />
                  <Text style={styles.receiptBtnText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {/* Budget Selector */}
          {activeBudgets.length > 0 && (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <Text style={styles.sectionLabel}>Budget (optional)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.projectScroll}
              >
                {/* None option */}
                <TouchableOpacity
                  style={[
                    styles.projectChip,
                    !selectedBudgetId && styles.projectChipSelected,
                  ]}
                  onPress={() => {
                    setSelectedBudgetId(undefined);
                    setIsPending(false);
                  }}
                >
                  <MaterialIcons
                    name="do-not-disturb-on"
                    size={16}
                    color={!selectedBudgetId ? COLORS.textPrimary : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.projectChipText,
                      !selectedBudgetId && styles.projectChipTextSelected,
                    ]}
                  >
                    None
                  </Text>
                </TouchableOpacity>

                {activeBudgets.map((b) => {
                  const isSelected = selectedBudgetId === b.id;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[
                        styles.projectChip,
                        isSelected && {
                          borderColor: b.color,
                          backgroundColor: `${b.color}18`,
                        },
                      ]}
                      onPress={() => setSelectedBudgetId(b.id)}
                    >
                      <View
                        style={[
                          styles.projectChipDot,
                          { backgroundColor: b.color },
                        ]}
                      />
                      <Text
                        style={[
                          styles.projectChipText,
                          isSelected && { color: b.color },
                        ]}
                        numberOfLines={1}
                      >
                        {b.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Pending Toggle - only shown when a budget is selected */}
              {selectedBudgetId && (
                <View style={styles.pendingToggleContainer}>
                  <TouchableOpacity
                    style={[
                      styles.pendingToggleOption,
                      !isPending && styles.pendingToggleActive,
                    ]}
                    onPress={() => setIsPending(false)}
                  >
                    <MaterialIcons
                      name="flash-on"
                      size={16}
                      color={!isPending ? COLORS.textPrimary : COLORS.textMuted}
                    />
                    <Text
                      style={[
                        styles.pendingToggleText,
                        !isPending && styles.pendingToggleTextActive,
                      ]}
                    >
                      Deduct now
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.pendingToggleOption,
                      isPending && styles.pendingToggleActivePending,
                    ]}
                    onPress={() => setIsPending(true)}
                  >
                    <MaterialIcons
                      name="schedule"
                      size={16}
                      color={isPending ? COLORS.warning : COLORS.textMuted}
                    />
                    <Text
                      style={[
                        styles.pendingToggleText,
                        isPending && { color: COLORS.warning },
                      ]}
                    >
                      Deduct when completed
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          )}

          {/* Delete Button (inside scroll) */}
          {editingExpense && (
            <TouchableOpacity
              style={styles.deleteBtn}
              activeOpacity={0.8}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <MaterialIcons name="delete-outline" size={20} color={COLORS.danger} />
              <Text style={styles.deleteBtnText}>Delete Expense</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity
          style={styles.datePickerOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerTitle}>Select Date</Text>
            <View style={styles.datePickerRow}>
              <TouchableOpacity
                style={styles.datePickerArrow}
                onPress={() => setDate(new Date(date.getTime() - 86400000))}
              >
                <MaterialIcons name="chevron-left" size={28} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.datePickerValue}>
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
              <TouchableOpacity
                style={styles.datePickerArrow}
                onPress={() => setDate(new Date(date.getTime() + 86400000))}
              >
                <MaterialIcons name="chevron-right" size={28} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.datePickerQuick}>
              <TouchableOpacity
                style={styles.datePickerQuickBtn}
                onPress={() => setDate(new Date())}
              >
                <Text style={styles.datePickerQuickText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.datePickerQuickBtn}
                onPress={() => setDate(new Date(Date.now() - 86400000))}
              >
                <Text style={styles.datePickerQuickText}>Yesterday</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.datePickerDoneBtn}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.datePickerDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Save Button */}
      <View style={styles.bottomBar}>
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

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <TouchableOpacity
          style={styles.deleteConfirmOverlay}
          activeOpacity={1}
          onPress={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.deleteConfirmContainer}>
            <Text style={styles.deleteConfirmTitle}>Delete Expense</Text>
            <Text style={styles.deleteConfirmMessage}>Are you sure? This cannot be undone.</Text>
            <View style={styles.deleteConfirmButtons}>
              <TouchableOpacity
                style={styles.deleteConfirmCancelBtn}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.deleteConfirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmDeleteBtn}
                onPress={() => {
                  if (editingExpense) {
                    deleteExpense(editingExpense.id);
                    navigation.goBack();
                  }
                }}
              >
                <Text style={styles.deleteConfirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Receipt Full View Modal */}
      <Modal
        visible={showReceiptFull}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReceiptFull(false)}
      >
        <View style={styles.receiptFullOverlay}>
          <TouchableOpacity
            style={styles.receiptFullCloseBtn}
            onPress={() => setShowReceiptFull(false)}
          >
            <MaterialIcons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          {receiptUri && (
            <Image
              source={{ uri: receiptUri }}
              style={styles.receiptFullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* New Custom Category Modal */}
      <Modal
        visible={showNewCategory}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewCategory(false)}
      >
        <TouchableOpacity
          style={styles.newCatOverlay}
          activeOpacity={1}
          onPress={() => setShowNewCategory(false)}
        >
          <View style={styles.newCatContainer} onStartShouldSetResponder={() => true}>
            <Text style={styles.newCatTitle}>New Category</Text>

            <Text style={styles.newCatLabel}>Name</Text>
            <TextInput
              style={styles.newCatInput}
              value={newCatName}
              onChangeText={setNewCatName}
              placeholder="e.g., Pets, Travel, Gifts"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
            />

            <Text style={styles.newCatLabel}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
              <View style={styles.newCatIconGrid}>
                {CUSTOM_CATEGORY_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.newCatIconItem,
                      newCatIcon === icon && { backgroundColor: `${newCatColor}25`, borderColor: newCatColor },
                    ]}
                    onPress={() => setNewCatIcon(icon)}
                  >
                    <MaterialIcons
                      name={icon as any}
                      size={20}
                      color={newCatIcon === icon ? newCatColor : COLORS.textMuted}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.newCatLabel}>Color</Text>
            <View style={styles.newCatColorGrid}>
              {CUSTOM_CATEGORY_COLOR_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.newCatColorItem,
                    { backgroundColor: c },
                    newCatColor === c && styles.newCatColorSelected,
                  ]}
                  onPress={() => setNewCatColor(c)}
                >
                  {newCatColor === c && (
                    <MaterialIcons name="check" size={14} color="#FFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.newCatButtons}>
              <TouchableOpacity
                style={styles.newCatCancelBtn}
                onPress={() => setShowNewCategory(false)}
              >
                <Text style={styles.newCatCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.newCatSaveBtn, { backgroundColor: `${newCatColor}20` }]}
                onPress={() => {
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
                }}
              >
                <Text style={[styles.newCatSaveText, { color: newCatColor }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const CUSTOM_CATEGORY_ICONS = [
  'label', 'pets', 'flight', 'card-giftcard', 'fitness-center',
  'local-cafe', 'local-bar', 'local-gas-station', 'local-pharmacy',
  'child-care', 'build', 'brush', 'camera-alt', 'music-note',
  'sports-esports', 'park', 'beach-access', 'cake', 'local-florist',
  'handyman', 'savings', 'volunteer-activism', 'checkroom', 'dry-cleaning',
];

const CUSTOM_CATEGORY_COLOR_OPTIONS = [
  '#6C63FF', '#FF6B9D', '#00D68F', '#FF8E53', '#45B7D1',
  '#BB8FCE', '#F7DC6F', '#EC7063', '#5DADE2', '#82E0AA',
  '#F0B27A', '#4ECDC4',
];

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

  // Amount
  amountSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  amountLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currencySymbol: {
    fontSize: 28,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 8,
    marginRight: 4,
  },
  amountInput: {
    fontSize: 56,
    color: COLORS.textPrimary,
    fontWeight: '800',
    letterSpacing: -2,
    minWidth: 120,
    textAlign: 'center',
  },
  amountLine: {
    width: 200,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  amountLineGradient: {
    flex: 1,
  },

  // Currency chips
  currencyChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  currencyChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
  },
  currencyChipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  currencyChipTextSelected: {
    color: COLORS.primary,
  },

  // Categories
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryItem: {
    width: '30.5%',
    aspectRatio: 1.1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    position: 'relative',
  },
  categoryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  selectedDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Receipt
  receiptButtonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  receiptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    gap: SPACING.sm,
  },
  receiptBtnText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  receiptPreviewContainer: {
    alignItems: 'center',
  },
  receiptPreview: {
    width: '100%',
    height: 180,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  receiptActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  receiptActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  receiptActionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  receiptFullOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptFullCloseBtn: {
    position: 'absolute',
    top: 60,
    right: SPACING.lg,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptFullImage: {
    width: '90%',
    height: '70%',
  },

  // Description
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
  },
  dateText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },

  // Project Selector
  projectScroll: {
    marginBottom: SPACING.md,
  },
  projectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
    gap: 6,
  },
  projectChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
  },
  projectChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  projectChipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
    maxWidth: 120,
  },
  projectChipTextSelected: {
    color: COLORS.textPrimary,
  },

  // Pending Toggle
  pendingToggleContainer: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pendingToggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.sm,
    gap: 6,
  },
  pendingToggleActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
  },
  pendingToggleActivePending: {
    backgroundColor: 'rgba(255, 170, 0, 0.12)',
  },
  pendingToggleText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  pendingToggleTextActive: {
    color: COLORS.textPrimary,
  },

  // Date Picker
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: '85%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  datePickerTitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  datePickerArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerValue: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  datePickerQuick: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  datePickerQuickBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  datePickerQuickText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  datePickerDoneBtn: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  datePickerDoneText: {
    fontSize: FONT_SIZE.md,
    color: '#FFF',
    fontWeight: '700',
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
  deleteConfirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteConfirmContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '80%',
    maxWidth: 340,
  },
  deleteConfirmTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  deleteConfirmMessage: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
  },
  deleteConfirmCancelBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  deleteConfirmCancelText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  deleteConfirmDeleteBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255, 61, 113, 0.12)',
  },
  deleteConfirmDeleteText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.danger,
  },

  // New Category Modal
  newCatOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newCatContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '88%',
    maxWidth: 380,
  },
  newCatTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  newCatLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  newCatInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  newCatIconGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  newCatIconItem: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  newCatColorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  newCatColorItem: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newCatColorSelected: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  newCatButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
  },
  newCatCancelBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
  },
  newCatCancelText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  newCatSaveBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  newCatSaveText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});
