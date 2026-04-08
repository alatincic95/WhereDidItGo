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
import {
  Income,
  INCOME_SOURCES,
  INCOME_SOURCE_ICONS,
  INCOME_SOURCE_COLORS,
  IncomeSource,
} from '../types';

export const AddIncomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editingIncome: Income | undefined = route.params?.income;

  const { addIncome, updateIncome, deleteIncome, currencySymbol } = useExpenseStore();

  const [amount, setAmount] = useState(editingIncome?.amount?.toString() || '');
  const [source, setSource] = useState<string>(editingIncome?.source || '');
  const [description, setDescription] = useState(editingIncome?.description || '');
  const [date, setDate] = useState(
    editingIncome?.date ? new Date(editingIncome.date) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

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
    if (!source) {
      Alert.alert('Select Source', 'Please select an income source');
      return;
    }

    const incomeData = {
      amount: parseFloat(amount),
      source: source as IncomeSource,
      description,
      date: date.toISOString(),
    };

    if (editingIncome) {
      updateIncome(editingIncome.id, incomeData);
    } else {
      addIncome(incomeData);
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
            {editingIncome ? 'Edit Income' : 'New Income'}
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
              <Text style={styles.currencySymbol}>{currencySymbol}</Text>
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
                colors={['#00D68F', '#45B7D1', '#6C63FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.amountLineGradient}
              />
            </View>
          </Animated.View>

          {/* Source Selector */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Text style={styles.sectionLabel}>Source</Text>
            <View style={styles.sourceGrid}>
              {INCOME_SOURCES.map((src) => {
                const isSelected = source === src;
                const color = INCOME_SOURCE_COLORS[src];
                const icon = INCOME_SOURCE_ICONS[src];

                return (
                  <TouchableOpacity
                    key={src}
                    style={[
                      styles.sourceItem,
                      isSelected && {
                        borderColor: color,
                        backgroundColor: `${color}15`,
                      },
                    ]}
                    onPress={() => setSource(src)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.sourceIconWrap,
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
                        styles.sourceText,
                        isSelected && { color },
                      ]}
                    >
                      {src}
                    </Text>
                    {isSelected && (
                      <View style={[styles.selectedDot, { backgroundColor: color }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
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
                placeholder="Where did this income come from?"
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

          {/* Delete Button (inside scroll) */}
          {editingIncome && (
            <TouchableOpacity
              style={styles.deleteBtn}
              activeOpacity={0.8}
              onPress={() => {
                deleteIncome(editingIncome.id);
                navigation.goBack();
              }}
            >
              <MaterialIcons name="delete-outline" size={20} color={COLORS.danger} />
              <Text style={styles.deleteBtnText}>Delete Income</Text>
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

      {/* Bottom Buttons */}
      <View style={styles.bottomBar}>
        {editingIncome && (
          <TouchableOpacity
            style={styles.deleteBtn}
            activeOpacity={0.8}
            onPress={() => {
              Alert.alert(
                'Delete Income',
                'Are you sure? This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      deleteIncome(editingIncome.id);
                      navigation.goBack();
                    },
                  },
                ]
              );
            }}
          >
            <MaterialIcons name="delete-outline" size={20} color={COLORS.danger} />
            <Text style={styles.deleteBtnText}>Delete Income</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.saveBtn}
          activeOpacity={0.8}
          onPress={handleSave}
        >
          <LinearGradient
            colors={['#00D68F', '#45B7D1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveBtnGradient}
          >
            <MaterialIcons name="check" size={22} color="#FFF" />
            <Text style={styles.saveBtnText}>
              {editingIncome ? 'Update Income' : 'Add Income'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    color: '#00D68F',
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

  // Sources
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  sourceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  sourceItem: {
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
  sourceIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  sourceText: {
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

  // Bottom Buttons
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  deleteBtnText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.danger,
    fontWeight: '600',
  },
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
