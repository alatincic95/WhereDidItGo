import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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
import { Budget } from '../../types';

interface BudgetSelectorProps {
  selectedBudgetId: string | undefined;
  setSelectedBudgetId: (val: string | undefined) => void;
  isPending: boolean;
  setIsPending: (val: boolean) => void;
  activeBudgets: Budget[];
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

export const BudgetSelector: React.FC<BudgetSelectorProps> = ({
  selectedBudgetId,
  setSelectedBudgetId,
  isPending,
  setIsPending,
  activeBudgets,
  fadeAnim,
  slideAnim,
}) => {
  const { colors } = useTheme();

  if (activeBudgets.length === 0) return null;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Budget (optional)</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.projectScroll}
      >
        {/* None option */}
        <TouchableOpacity
          style={[
            styles.projectChip,
            { backgroundColor: colors.surface, borderColor: colors.border },
            !selectedBudgetId && { borderColor: colors.primary, backgroundColor: `${colors.primary}1F` },
          ]}
          onPress={() => {
            setSelectedBudgetId(undefined);
            setIsPending(false);
          }}
        >
          <MaterialIcons
            name="do-not-disturb-on"
            size={16}
            color={!selectedBudgetId ? colors.textPrimary : colors.textMuted}
          />
          <Text
            style={[
              styles.projectChipText,
              { color: colors.textMuted },
              !selectedBudgetId && { color: colors.textPrimary },
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
                { backgroundColor: colors.surface, borderColor: colors.border },
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
                  { color: colors.textMuted },
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
        <View style={[styles.pendingToggleContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.pendingToggleOption,
              !isPending && { backgroundColor: `${colors.primary}26` },
            ]}
            onPress={() => setIsPending(false)}
          >
            <MaterialIcons
              name="flash-on"
              size={16}
              color={!isPending ? colors.textPrimary : colors.textMuted}
            />
            <Text
              style={[
                styles.pendingToggleText,
                { color: colors.textMuted },
                !isPending && { color: colors.textPrimary },
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
              color={isPending ? COLORS.warning : colors.textMuted}
            />
            <Text
              style={[
                styles.pendingToggleText,
                { color: colors.textMuted },
                isPending && { color: COLORS.warning },
              ]}
            >
              Deduct when completed
            </Text>
          </TouchableOpacity>
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
  pendingToggleActivePending: {
    backgroundColor: 'rgba(255, 170, 0, 0.12)',
  },
  pendingToggleText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
