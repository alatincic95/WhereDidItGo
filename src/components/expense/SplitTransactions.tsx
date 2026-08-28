import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
} from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import {
  CATEGORY_COLORS,
  ExpenseCategory,
  ExpenseSplit,
  CustomCategory,
  Budget,
} from '../../types';

interface SplitTransactionsProps {
  splits: ExpenseSplit[];
  setSplits: (splits: ExpenseSplit[]) => void;
  amount: string;
  orderedCategories: string[];
  customCategories: CustomCategory[];
  activeBudgets: Budget[];
  currencySymbol: string;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

export const SplitTransactions: React.FC<SplitTransactionsProps> = ({
  splits,
  setSplits,
  amount,
  orderedCategories,
  customCategories,
  activeBudgets,
  currencySymbol,
  fadeAnim,
  slideAnim,
}) => {
  const { colors } = useTheme();
  const splitsTotal = splits.reduce((s, x) => s + (x.amount || 0), 0);
  const splitsValid = splits.length === 0 || Math.abs(splitsTotal - (parseFloat(amount) || 0)) < 0.01;

  const MAX_SPLITS = 10;

  const addSplit = () => {
    if (splits.length >= MAX_SPLITS) return;
    const { EXPENSE_CATEGORIES } = require('../../types');
    setSplits([...splits, { category: orderedCategories[0] || EXPENSE_CATEGORIES[0], amount: 0 }]);
  };

  const updateSplit = (idx: number, patch: Partial<ExpenseSplit>) => {
    setSplits(splits.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const removeSplit = (idx: number) => {
    setSplits(splits.filter((_, i) => i !== idx));
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={styles.splitHeaderRow}>
        <Text style={[styles.sectionLabel, { marginTop: 0, marginBottom: 0, color: colors.textMuted }]}>Split (optional)</Text>
        <TouchableOpacity
          style={[styles.splitAddBtn, { backgroundColor: `${colors.primary}1A`, borderColor: `${colors.primary}4D`, opacity: splits.length >= MAX_SPLITS ? 0.4 : 1 }]}
          onPress={addSplit}
          activeOpacity={0.7}
          disabled={splits.length >= MAX_SPLITS}
        >
          <MaterialIcons name="call-split" size={16} color={colors.primary} />
          <Text style={[styles.splitAddText, { color: colors.primary }]}>
            {splits.length >= MAX_SPLITS ? `Max ${MAX_SPLITS}` : 'Add Split'}
          </Text>
        </TouchableOpacity>
      </View>
      {splits.length > 0 && (
        <View style={styles.splitsList}>
          {splits.map((sp, idx) => (
            <View key={idx} style={[styles.splitRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.splitCategoryWrap}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {orderedCategories.map((cat) => {
                    const isSel = sp.category === cat;
                    const custom = customCategories.find((c) => c.name === cat);
                    const color = custom?.color || CATEGORY_COLORS[cat as ExpenseCategory] || '#AEB6BF';
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.splitCatChip,
                          { borderColor: colors.border },
                          isSel && { borderColor: color, backgroundColor: `${color}18` },
                        ]}
                        onPress={() => updateSplit(idx, { category: cat })}
                      >
                        <Text style={[styles.splitCatChipText, { color: colors.textMuted }, isSel && { color }]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
              <View style={styles.splitAmountRow}>
                <View style={[styles.splitAmountWrap, { backgroundColor: `${colors.primary}0F` }]}>
                  <Text style={[styles.splitCurrency, { color: colors.primary }]}>{currencySymbol}</Text>
                  <TextInput
                    style={[styles.splitAmountInput, { color: colors.textPrimary }]}
                    value={sp.amount ? sp.amount.toString() : ''}
                    onChangeText={(v) => updateSplit(idx, { amount: parseFloat(v) || 0 })}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
                {activeBudgets.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                    <TouchableOpacity
                      style={[
                        styles.splitBudgetChip,
                        { borderColor: colors.border },
                        !sp.projectId && { borderColor: colors.primary, backgroundColor: `${colors.primary}1F` },
                      ]}
                      onPress={() => updateSplit(idx, { projectId: undefined })}
                    >
                      <Text style={[styles.splitBudgetChipText, { color: colors.textMuted }]}>None</Text>
                    </TouchableOpacity>
                    {activeBudgets.map((b) => (
                      <TouchableOpacity
                        key={b.id}
                        style={[
                          styles.splitBudgetChip,
                          { borderColor: colors.border },
                          sp.projectId === b.id && { borderColor: b.color, backgroundColor: `${b.color}18` },
                        ]}
                        onPress={() => updateSplit(idx, { projectId: b.id })}
                      >
                        <View style={[styles.splitBudgetDot, { backgroundColor: b.color }]} />
                        <Text style={[styles.splitBudgetChipText, { color: colors.textMuted }, sp.projectId === b.id && { color: b.color }]} numberOfLines={1}>
                          {b.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
                <TouchableOpacity style={styles.splitRemoveBtn} onPress={() => removeSplit(idx)}>
                  <MaterialIcons name="close" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={[styles.splitSummary, !splitsValid && styles.splitSummaryError]}>
            <Text style={[styles.splitSummaryText, { color: colors.textSecondary }]}>
              Splits: {splitsTotal.toFixed(2)} / {(parseFloat(amount) || 0).toFixed(2)}
            </Text>
            {!splitsValid && (
              <Text style={[styles.splitSummaryWarning, { color: colors.danger }]}>
                Must equal total
              </Text>
            )}
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  splitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  splitAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(108, 99, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
    gap: 4,
  },
  splitAddText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '700',
  },
  splitsList: {
    gap: SPACING.sm,
  },
  splitRow: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  splitCategoryWrap: {
    marginBottom: SPACING.sm,
  },
  splitCatChip: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  splitCatChipText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  splitAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  splitAmountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 99, 255, 0.06)',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    height: 36,
    minWidth: 100,
  },
  splitCurrency: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '700',
    marginRight: 4,
  },
  splitAmountInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
    minWidth: 60,
  },
  splitBudgetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 4,
    gap: 4,
  },
  splitBudgetChipSel: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
  },
  splitBudgetChipText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    maxWidth: 80,
  },
  splitBudgetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  splitRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splitSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(0, 214, 143, 0.08)',
    borderRadius: BORDER_RADIUS.sm,
  },
  splitSummaryError: {
    backgroundColor: 'rgba(255, 61, 113, 0.10)',
  },
  splitSummaryText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  splitSummaryWarning: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.danger,
    fontWeight: '700',
  },
});
