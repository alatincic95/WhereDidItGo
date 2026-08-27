import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useExpenseStore } from '../store/useExpenseStore';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { CURRENCY_OPTIONS } from '../utils/currency';
import { EXPENSE_CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS, ExpenseCategory } from '../types';

const { width } = Dimensions.get('window');

const STEPS = [
  { title: 'Welcome', subtitle: 'Let\'s set up your finances' },
  { title: 'Currency', subtitle: 'Choose your base currency' },
  { title: 'Income', subtitle: 'What\'s your monthly income?' },
  { title: 'Categories', subtitle: 'Pick your top spending areas' },
  { title: 'All Set!', subtitle: 'You\'re ready to track your money' },
];

export const OnboardingScreen: React.FC = () => {
  const { colors, isDark, toggle } = useTheme();
  const [step, setStep] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState('$');
  const [incomeInput, setIncomeInput] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Food', 'Transport', 'Housing', 'Entertainment',
  ]);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const {
    setCurrencySymbol,
    setMonthlyIncome,
    setOnboardingCompleted,
  } = useExpenseStore();

  const animateTransition = (next: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setStep(next);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      animateTransition(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      animateTransition(step - 1);
    }
  };

  const handleFinish = () => {
    setCurrencySymbol(selectedCurrency);
    const val = parseFloat(incomeInput);
    if (!isNaN(val) && val > 0) {
      setMonthlyIncome(val);
    }
    setOnboardingCompleted(true);
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <View style={[styles.welcomeIcon, { backgroundColor: `${colors.primary}20` }]}>
              <MaterialIcons name="account-balance-wallet" size={64} color={colors.primary} />
            </View>
            <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>
              WhereDidItGo?
            </Text>
            <Text style={[styles.welcomeDesc, { color: colors.textSecondary }]}>
              Track your expenses, income, and budgets all in one place.
              Let's get you set up in just a few steps.
            </Text>
            <TouchableOpacity style={styles.themeToggle} onPress={toggle}>
              <MaterialIcons
                name={isDark ? 'dark-mode' : 'light-mode'}
                size={20}
                color={colors.textSecondary}
              />
              <Text style={[styles.themeToggleText, { color: colors.textSecondary }]}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepLabel, { color: colors.textPrimary }]}>
              Select your currency
            </Text>
            <FlatList
              data={CURRENCY_OPTIONS}
              keyExtractor={(item) => item.symbol}
              style={styles.currencyList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.currencyItem,
                    {
                      backgroundColor: selectedCurrency === item.symbol
                        ? `${colors.primary}15`
                        : colors.surface,
                      borderColor: selectedCurrency === item.symbol
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedCurrency(item.symbol)}
                >
                  <Text style={[styles.currencySymbol, { color: colors.primary }]}>
                    {item.symbol}
                  </Text>
                  <Text style={[styles.currencyLabel, { color: colors.textPrimary }]}>
                    {item.label}
                  </Text>
                  {selectedCurrency === item.symbol && (
                    <MaterialIcons name="check-circle" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        );

      case 2:
        return (
          <View style={[styles.stepContent, { justifyContent: 'flex-end', paddingBottom: SPACING.xl }]}>
            <View style={[styles.incomeIcon, { backgroundColor: `${colors.success}20` }]}>
              <MaterialIcons name="attach-money" size={48} color={colors.success} />
            </View>
            <Text style={[styles.stepLabel, { color: colors.textPrimary }]}>
              Monthly income
            </Text>
            <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
              Enter your base monthly income (salary, etc.)
            </Text>
            <View style={[styles.incomeInputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.incomePrefix, { color: colors.primary }]}>{selectedCurrency}</Text>
              <TextInput
                style={[styles.incomeInput, { color: colors.textPrimary }]}
                value={incomeInput}
                onChangeText={setIncomeInput}
                placeholder="3,000"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>
              You can always change this later in settings
            </Text>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepLabel, { color: colors.textPrimary }]}>
              Your spending categories
            </Text>
            <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
              Select the categories that matter most to you
            </Text>
            <View style={styles.categoriesGrid}>
              {EXPENSE_CATEGORIES.map((cat) => {
                const selected = selectedCategories.includes(cat);
                const color = CATEGORY_COLORS[cat as ExpenseCategory];
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: selected ? `${color}20` : colors.surface,
                        borderColor: selected ? color : colors.border,
                      },
                    ]}
                    onPress={() => toggleCategory(cat)}
                  >
                    <MaterialIcons
                      name={CATEGORY_ICONS[cat as ExpenseCategory] as any}
                      size={20}
                      color={selected ? color : colors.textMuted}
                    />
                    <Text style={[
                      styles.categoryChipText,
                      { color: selected ? color : colors.textSecondary },
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <View style={[styles.doneIcon, { backgroundColor: `${colors.success}20` }]}>
              <MaterialIcons name="check-circle" size={64} color={colors.success} />
            </View>
            <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>
              You're all set!
            </Text>
            <Text style={[styles.welcomeDesc, { color: colors.textSecondary }]}>
              Start tracking your expenses and take control of your finances.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress dots */}
      <View style={styles.progressRow}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i <= step ? colors.primary : colors.border,
                width: i === step ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Step content */}
      <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
        {renderStep()}
      </Animated.View>

      {/* Navigation buttons */}
      <View style={styles.navRow}>
        {step > 0 ? (
          <TouchableOpacity style={[styles.backBtn, { borderColor: colors.border }]} onPress={handleBack}>
            <MaterialIcons name="arrow-back" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}

        {step < STEPS.length - 1 ? (
          <TouchableOpacity onPress={handleNext}>
            <LinearGradient colors={[colors.primary, '#9B59B6']} style={styles.nextBtn}>
              <Text style={styles.nextBtnText}>Continue</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleFinish}>
            <LinearGradient colors={[colors.success, '#45B7D1']} style={styles.nextBtn}>
              <Text style={styles.nextBtnText}>Get Started</Text>
              <MaterialIcons name="rocket-launch" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingBottom: 50,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  welcomeTitle: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  welcomeDesc: {
    fontSize: FONT_SIZE.lg,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.lg,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
  },
  themeToggleText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  stepLabel: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  stepDesc: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  currencyList: {
    width: '100%',
    maxHeight: 380,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  currencySymbol: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    width: 32,
    textAlign: 'center',
  },
  currencyLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
    flex: 1,
  },
  incomeIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  incomeInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    width: '80%',
    marginBottom: SPACING.md,
  },
  incomePrefix: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    marginRight: SPACING.sm,
  },
  incomeInput: {
    flex: 1,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '600',
  },
  skipText: {
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.sm,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    width: '100%',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1.5,
    gap: SPACING.sm,
  },
  categoryChipText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  doneIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  backBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.round,
    gap: SPACING.sm,
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
});
