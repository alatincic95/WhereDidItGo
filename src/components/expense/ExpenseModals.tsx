import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
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
  RecurringFrequency,
  FREQUENCY_OPTIONS,
} from '../../types';

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

// --- Delete Confirmation Modal ---

interface DeleteConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  visible,
  onClose,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.deleteConfirmOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.deleteConfirmContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.deleteConfirmTitle, { color: colors.textPrimary }]}>Delete Expense</Text>
          <Text style={[styles.deleteConfirmMessage, { color: colors.textSecondary }]}>Are you sure? This cannot be undone.</Text>
          <View style={styles.deleteConfirmButtons}>
            <TouchableOpacity
              style={[styles.deleteConfirmCancelBtn, { backgroundColor: colors.background }]}
              onPress={onClose}
            >
              <Text style={[styles.deleteConfirmCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteConfirmDeleteBtn}
              onPress={onDelete}
            >
              <Text style={[styles.deleteConfirmDeleteText, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// --- Convert to Recurring Modal ---

interface ConvertToRecurringModalProps {
  visible: boolean;
  onClose: () => void;
  convertFrequency: RecurringFrequency;
  setConvertFrequency: (val: RecurringFrequency) => void;
  onConvert: () => void;
}

export const ConvertToRecurringModal: React.FC<ConvertToRecurringModalProps> = ({
  visible,
  onClose,
  convertFrequency,
  setConvertFrequency,
  onConvert,
}) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.deleteConfirmOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.deleteConfirmContainer, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
          <Text style={[styles.deleteConfirmTitle, { color: colors.textPrimary }]}>Convert to Recurring</Text>
          <Text style={[styles.deleteConfirmMessage, { color: colors.textSecondary }]}>
            This expense will be moved to your recurring list and removed from one-time expenses. Choose how often it repeats.
          </Text>
          <View style={styles.convertFreqRow}>
            {FREQUENCY_OPTIONS.map((f) => {
              const isSel = convertFrequency === f.value;
              return (
                <TouchableOpacity
                  key={f.value}
                  style={[
                    styles.convertFreqChip,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    isSel && { borderColor: colors.primary, backgroundColor: `${colors.primary}26` },
                  ]}
                  onPress={() => setConvertFrequency(f.value)}
                >
                  <Text style={[
                    styles.convertFreqText,
                    { color: colors.textMuted },
                    isSel && { color: colors.primary },
                  ]}>
                    {f.shortLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.deleteConfirmButtons}>
            <TouchableOpacity
              style={[styles.deleteConfirmCancelBtn, { backgroundColor: colors.background }]}
              onPress={onClose}
            >
              <Text style={[styles.deleteConfirmCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteConfirmDeleteBtn, { backgroundColor: `${colors.primary}26` }]}
              onPress={onConvert}
            >
              <Text style={[styles.deleteConfirmDeleteText, { color: colors.primary }]}>Convert</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// --- New Category Modal ---

interface NewCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  newCatName: string;
  setNewCatName: (val: string) => void;
  newCatIcon: string;
  setNewCatIcon: (val: string) => void;
  newCatColor: string;
  setNewCatColor: (val: string) => void;
  onSave: () => void;
}

export const NewCategoryModal: React.FC<NewCategoryModalProps> = ({
  visible,
  onClose,
  newCatName,
  setNewCatName,
  newCatIcon,
  setNewCatIcon,
  newCatColor,
  setNewCatColor,
  onSave,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.newCatOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.newCatContainer, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
          <Text style={[styles.newCatTitle, { color: colors.textPrimary }]}>New Category</Text>

          <Text style={[styles.newCatLabel, { color: colors.textMuted }]}>Name</Text>
          <TextInput
            style={[styles.newCatInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
            value={newCatName}
            onChangeText={setNewCatName}
            placeholder="e.g., Pets, Travel, Gifts"
            placeholderTextColor={colors.textMuted}
            autoFocus
            maxLength={50}
          />

          <Text style={[styles.newCatLabel, { color: colors.textMuted }]}>Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.md }}>
            <View style={styles.newCatIconGrid}>
              {CUSTOM_CATEGORY_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.newCatIconItem,
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
                    newCatIcon === icon && { backgroundColor: `${newCatColor}25`, borderColor: newCatColor },
                  ]}
                  onPress={() => setNewCatIcon(icon)}
                >
                  <MaterialIcons
                    name={icon as any}
                    size={20}
                    color={newCatIcon === icon ? newCatColor : colors.textMuted}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={[styles.newCatLabel, { color: colors.textMuted }]}>Color</Text>
          <View style={styles.newCatColorGrid}>
            {CUSTOM_CATEGORY_COLOR_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.newCatColorItem,
                  { backgroundColor: c },
                  newCatColor === c && { borderWidth: 2, borderColor: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)' },
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
              style={[styles.newCatCancelBtn, { backgroundColor: colors.background }]}
              onPress={onClose}
            >
              <Text style={[styles.newCatCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.newCatSaveBtn, { backgroundColor: `${newCatColor}20` }]}
              onPress={onSave}
            >
              <Text style={[styles.newCatSaveText, { color: newCatColor }]}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Delete Confirm
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

  // Convert to Recurring
  convertFreqRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  convertFreqChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  convertFreqText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
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
