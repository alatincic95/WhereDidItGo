import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';

const SUGGESTIONS = [
  "What's my balance?",
  'How much did I spend this month?',
  'Show my recent expenses',
  'Add expense coffee 4.50',
  'Show my budgets',
  'Category breakdown',
];

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onSelect, disabled }) => {
  const { colors } = useTheme();

  if (disabled) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>Try asking:</Text>
      <View style={styles.chipContainer}>
        {SUGGESTIONS.map((prompt) => (
          <TouchableOpacity
            key={prompt}
            style={[styles.chip, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '25' }]}
            activeOpacity={0.7}
            onPress={() => onSelect(prompt)}
          >
            <Text style={[styles.chipText, { color: colors.primary }]}>{prompt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    marginLeft: 2,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chip: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
  },
  chipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
});
