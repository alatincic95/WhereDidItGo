import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  ExpenseCategory,
  CustomCategory,
} from '../../types';

interface CategorySuggestionInfo {
  category: string;
  confidence: number;
  source: 'history' | 'keyword';
}

interface CategoryGridProps {
  category: string;
  setCategory: (val: string) => void;
  orderedCategories: string[];
  customCategories: CustomCategory[];
  onAddCustom: () => void;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  suggestion?: CategorySuggestionInfo | null;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  category,
  setCategory,
  orderedCategories,
  customCategories,
  onAddCustom,
  fadeAnim,
  slideAnim,
  suggestion,
}) => {
  const { colors, isDark } = useTheme();
  const showSuggestion = suggestion && suggestion.confidence >= 0.4 && suggestion.category !== category;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Category</Text>

      {/* Smart suggestion chip */}
      {showSuggestion && (
        <TouchableOpacity
          style={[styles.suggestionBar, { backgroundColor: `${colors.primary}14`, borderColor: `${colors.primary}33` }]}
          onPress={() => setCategory(suggestion!.category)}
          activeOpacity={0.7}
        >
          <MaterialIcons name="auto-awesome" size={16} color={colors.primary} />
          <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
            Suggested:{' '}
            <Text style={[styles.suggestionCategory, { color: colors.primary }]}>{suggestion!.category}</Text>
          </Text>
          <MaterialIcons name="arrow-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      )}

      <View style={styles.categoryGrid}>
        {orderedCategories.map((cat) => {
          const isSelected = category === cat;
          const custom = customCategories.find((c) => c.name === cat);
          const color = custom?.color || CATEGORY_COLORS[cat as ExpenseCategory] || '#AEB6BF';
          const icon = custom?.icon || CATEGORY_ICONS[cat as ExpenseCategory] || 'more-horiz';

          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryItem,
                { backgroundColor: colors.surface, borderColor: colors.border },
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
                    backgroundColor: isSelected ? `${color}25` : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
                  },
                ]}
              >
                <MaterialIcons
                  name={icon as any}
                  size={22}
                  color={isSelected ? color : colors.textMuted}
                />
              </View>
              <Text
                style={[
                  styles.categoryText,
                  { color: colors.textSecondary },
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
        {/* Add Custom Category */}
        <TouchableOpacity
          style={[styles.categoryItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={onAddCustom}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.categoryIconWrap,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
            ]}
          >
            <MaterialIcons name="add" size={22} color={colors.textMuted} />
          </View>
          <Text style={[styles.categoryText, { color: colors.textSecondary }]}>Custom</Text>
        </TouchableOpacity>
      </View>
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
  suggestionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
    marginBottom: SPACING.sm,
  },
  suggestionText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  suggestionCategory: {
    color: '#6C63FF',
    fontWeight: '700',
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
});
