import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';
import { parseExpenseText, isValidQuickExpense } from '../../utils/nlParser';
import { suggestCategory } from '../../utils/categorySuggester';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useUndoStore } from '../../store/useUndoStore';
import { CategoryIcon } from '../CategoryIcon';
import { formatCurrency } from '../../utils/currency';
import { hapticSuccess } from '../../utils/haptics';

interface QuickAddBarProps {
  onExpenseAdded?: () => void;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({ onExpenseAdded }) => {
  const { colors, isDark } = useTheme();
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const previewAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const [showSuccess, setShowSuccess] = useState(false);

  const { addExpense, deleteExpense, addExpenseWithId, expenses, customCategories } = useExpenseStore();
  const showUndo = useUndoStore((s) => s.show);

  const parsed = parseExpenseText(input);
  const isValid = isValidQuickExpense(parsed);

  // Get category suggestion
  const suggestion = parsed.description
    ? suggestCategory(
        parsed.description,
        expenses,
        customCategories.map((c) => c.name)
      )
    : null;

  // Use explicit category hint from parser first, then suggestion engine
  const resolvedCategory = parsed.categoryHint || suggestion?.category || null;
  const confidence = parsed.categoryHint ? 1 : suggestion?.confidence || 0;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  useEffect(() => {
    Animated.timing(previewAnim, {
      toValue: isValid ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isValid]);

  const handleSubmit = () => {
    if (!isValid || !parsed.amount) return;

    const category = resolvedCategory || 'Other';

    const expenseData = {
      amount: parsed.amount,
      category,
      description: parsed.description || category,
      date: new Date().toISOString(),
      isFixed: false,
    };

    addExpense(expenseData);
    hapticSuccess();

    // Find the just-added expense (first in array after addExpense prepends)
    const latest = useExpenseStore.getState().expenses[0];
    if (latest) {
      showUndo({
        message: 'Expense added',
        entityType: 'expense',
        restore: () => deleteExpense(latest.id),
      });
    }

    // Success feedback
    setShowSuccess(true);
    Animated.sequence([
      Animated.timing(successAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(successAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setShowSuccess(false));

    setInput('');
    Keyboard.dismiss();
    onExpenseAdded?.();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isDark ? 'rgba(108, 99, 255, 0.15)' : 'rgba(108, 99, 255, 0.12)',
      isDark ? 'rgba(108, 99, 255, 0.5)' : 'rgba(108, 99, 255, 0.4)',
    ],
  });

  return (
    <View style={styles.wrapper}>
      {/* Input bar */}
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? 'rgba(22, 33, 62, 0.85)' : colors.surface,
            borderColor: borderColor as any,
          },
        ]}
      >
        <MaterialIcons
          name="flash-on"
          size={20}
          color={isFocused ? colors.primary : colors.textMuted}
        />
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: colors.textPrimary }]}
          value={input}
          onChangeText={setInput}
          placeholder='Quick add: "coffee 4.50" or "45 groceries"'
          placeholderTextColor={colors.textMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          autoCorrect={false}
          maxLength={200}
        />
        {input.length > 0 && (
          <TouchableOpacity
            onPress={() => setInput('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Preview card — shows when input is valid */}
      {isValid && parsed.amount && (
        <Animated.View
          style={[
            styles.preview,
            {
              opacity: previewAnim,
              transform: [
                {
                  translateY: previewAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 0],
                  }),
                },
              ],
              backgroundColor: isDark ? 'rgba(22, 33, 62, 0.9)' : colors.surface,
              borderColor: isDark ? 'rgba(108, 99, 255, 0.15)' : colors.border,
            },
          ]}
        >
          <View style={styles.previewLeft}>
            {resolvedCategory && (
              <View style={styles.categoryChip}>
                <CategoryIcon category={resolvedCategory} size={14} />
                <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                  {resolvedCategory}
                </Text>
                {confidence < 0.7 && (
                  <Text style={[styles.unsureText, { color: colors.textMuted }]}>?</Text>
                )}
              </View>
            )}
            <Text style={[styles.previewAmount, { color: colors.textPrimary }]}>
              {formatCurrency(parsed.amount)}
            </Text>
            {parsed.description ? (
              <Text
                style={[styles.previewDesc, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {parsed.description}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={20} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Success toast */}
      {showSuccess && (
        <Animated.View
          style={[
            styles.successToast,
            {
              opacity: successAnim,
              transform: [
                {
                  scale: successAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
              backgroundColor: isDark ? 'rgba(0, 214, 143, 0.15)' : 'rgba(0, 214, 143, 0.1)',
              borderColor: isDark ? 'rgba(0, 214, 143, 0.3)' : 'rgba(0, 184, 118, 0.2)',
            },
          ]}
        >
          <MaterialIcons name="check-circle" size={16} color={colors.success} />
          <Text style={[styles.successText, { color: colors.success }]}>
            Expense added
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    paddingVertical: 4,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    marginTop: SPACING.sm,
  },
  previewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
  },
  categoryText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  unsureText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '400',
  },
  previewAmount: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  previewDesc: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    flex: 1,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.sm,
  },
  successText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});
