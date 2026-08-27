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

interface TagsInputProps {
  tags: string[];
  setTags: (tags: string[]) => void;
  tagInput: string;
  setTagInput: (val: string) => void;
  existingTags: string[];
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

export const TagsInput: React.FC<TagsInputProps> = ({
  tags,
  setTags,
  tagInput,
  setTagInput,
  existingTags,
  fadeAnim,
  slideAnim,
}) => {
  const { colors } = useTheme();

  const addTag = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (tags.includes(t)) return;
    setTags([...tags, t]);
    setTagInput('');
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Tags (optional)</Text>
      <View style={styles.tagsRow}>
        {tags.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tagChipSelected, { backgroundColor: `${colors.primary}26`, borderColor: colors.primary }]}
            onPress={() => removeTag(t)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tagChipSelectedText, { color: colors.primary }]}>#{t}</Text>
            <MaterialIcons name="close" size={14} color={colors.primary} />
          </TouchableOpacity>
        ))}
      </View>
      <View style={[styles.tagInputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <MaterialIcons name="local-offer" size={18} color={colors.textMuted} />
        <TextInput
          style={[styles.tagInput, { color: colors.textPrimary }]}
          value={tagInput}
          onChangeText={setTagInput}
          onSubmitEditing={() => addTag(tagInput)}
          returnKeyType="done"
          placeholder="Add tag (e.g., Vacation, Tax-deductible)"
          placeholderTextColor={colors.textMuted}
        />
        {tagInput.length > 0 && (
          <TouchableOpacity onPress={() => addTag(tagInput)}>
            <MaterialIcons name="add-circle" size={22} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
      {existingTags.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: SPACING.sm }}>
          {existingTags.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tagSuggestion, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => addTag(t)}
            >
              <Text style={[styles.tagSuggestionText, { color: colors.textMuted }]}>#{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  tagChipSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 4,
  },
  tagChipSelectedText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '700',
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  tagInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  tagSuggestion: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  tagSuggestionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
