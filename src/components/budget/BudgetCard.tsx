import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
} from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { Budget } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface BudgetCardProps {
  budget: Budget;
  getBudgetTotal: (id: string) => number;
  getBudgetPendingTotal: (id: string) => number;
  onPress: (budget: Budget) => void;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
  onToggleStatus: (budget: Budget) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budget: b,
  getBudgetTotal,
  getBudgetPendingTotal,
  onPress,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const { colors } = useTheme();
  const spent = getBudgetTotal(b.id);
  const pending = getBudgetPendingTotal(b.id);
  const hasBudget = b.budget && b.budget > 0;
  const progress = hasBudget ? spent / b.budget! : 0;
  const isOverBudget = progress > 1;
  const isCompleted = b.status === 'completed';

  return (
    <TouchableOpacity
      key={b.id}
      activeOpacity={0.7}
      onPress={() => onPress(b)}
      onLongPress={() => onDelete(b)}
    >
      <View style={[styles.budgetCard, { backgroundColor: colors.surface, borderColor: colors.border }, isCompleted && styles.budgetCardCompleted]}>
        {/* Color accent bar */}
        <View style={[styles.budgetAccent, { backgroundColor: b.color }]} />

        <View style={styles.budgetContent}>
          <View style={styles.budgetHeader}>
            <View style={styles.budgetTitleRow}>
              <View
                style={[styles.budgetDot, { backgroundColor: b.color }]}
              />
              <Text style={[styles.budgetName, { color: colors.textPrimary }]} numberOfLines={1}>
                {b.name}
              </Text>
            </View>
            <View style={styles.budgetActions}>
              {isCompleted && (
                <View style={[styles.completedBadge, { backgroundColor: `${colors.success}18` }]}>
                  <MaterialIcons name="check-circle" size={14} color={colors.success} />
                  <Text style={[styles.completedText, { color: colors.success }]}>Done</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.budgetActionBtn}
                onPress={() => onToggleStatus(b)}
              >
                <MaterialIcons
                  name={isCompleted ? 'replay' : 'check'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.budgetActionBtn}
                onPress={() => onEdit(b)}
              >
                <MaterialIcons name="edit" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {b.description ? (
            <Text style={[styles.budgetDesc, { color: colors.textMuted }]} numberOfLines={1}>
              {b.description}
            </Text>
          ) : null}

          <View style={styles.budgetStats}>
            <View>
              <Text style={[styles.budgetStatLabel, { color: colors.textMuted }]}>Spent</Text>
              <Text
                style={[
                  styles.budgetStatValue,
                  { color: isOverBudget ? colors.danger : b.color },
                ]}
              >
                {formatCurrency(spent)}
              </Text>
            </View>
            {pending > 0 && (
              <View>
                <Text style={[styles.budgetStatLabel, { color: colors.textMuted }]}>Pending</Text>
                <Text style={[styles.budgetStatValue, { color: colors.warning }]}>
                  {formatCurrency(pending)}
                </Text>
              </View>
            )}
            {hasBudget && (
              <View style={styles.budgetStatRight}>
                <Text style={[styles.budgetStatLabel, { color: colors.textMuted }]}>Budget</Text>
                <Text style={[styles.budgetStatValue, { color: colors.textPrimary }]}>
                  {formatCurrency(b.budget!)}
                </Text>
              </View>
            )}
          </View>

          {hasBudget && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: `${colors.border}` }]}>
                <LinearGradient
                  colors={
                    isOverBudget
                      ? ['#FF3D71', '#FF6B8A']
                      : progress > 0.75
                      ? ['#FFAA00', '#FFBB33']
                      : [b.color, `${b.color}CC`]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(progress * 100, 100)}%` },
                  ]}
                />
                {pending > 0 && hasBudget && (
                  <View
                    style={[
                      styles.progressPending,
                      {
                        width: `${Math.min((pending / b.budget!) * 100, 100 - Math.min(progress * 100, 100))}%`,
                        backgroundColor: `${colors.warning}40`,
                      },
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.progressText,
                  { color: colors.textSecondary },
                  isOverBudget && { color: colors.danger },
                ]}
              >
                {Math.round(progress * 100)}%
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  budgetCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(22, 33, 62, 0.7)',
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.08)',
    overflow: 'hidden',
  },
  budgetCardCompleted: {
    opacity: 0.6,
  },
  budgetAccent: {
    width: 4,
  },
  budgetContent: {
    flex: 1,
    padding: SPACING.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  budgetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  budgetDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  budgetName: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
    flex: 1,
  },
  budgetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  budgetActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 214, 143, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
    gap: 4,
    marginRight: 4,
  },
  completedText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.success,
    fontWeight: '600',
  },
  budgetDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: SPACING.sm,
  },
  budgetStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  budgetStatRight: {
    alignItems: 'flex-end',
  },
  budgetStatLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  budgetStatValue: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPending: {
    height: '100%',
  },
  progressText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '700',
    width: 40,
    textAlign: 'right',
  },
});
