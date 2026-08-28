import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
} from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { BUDGET_COLORS, Budget } from '../../types';

interface BudgetFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  onSaveAsTemplate: () => void;
  editingBudget: Budget | null;
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  budget: string;
  onBudgetChange: (value: string) => void;
  selectedColor: string;
  onColorChange: (value: string) => void;
}

export const BudgetFormModal: React.FC<BudgetFormModalProps> = ({
  visible,
  onClose,
  onSave,
  onSaveAsTemplate,
  editingBudget,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  budget,
  onBudgetChange,
  selectedColor,
  onColorChange,
}) => {
  const { colors } = useTheme();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.modalCancel, { color: colors.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
            {editingBudget ? 'Edit Budget' : 'New Budget'}
          </Text>
          <TouchableOpacity onPress={onSave}>
            <Text style={[styles.modalSave, { color: colors.primary }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          {/* Name */}
          <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Budget Name</Text>
          <TextInput
            style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
            value={name}
            onChangeText={onNameChange}
            placeholder="e.g., Summer Trip, New Kitchen"
            placeholderTextColor={colors.textMuted}
            autoFocus
            maxLength={100}
          />

          {/* Description */}
          <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Description</Text>
          <TextInput
            style={[styles.modalInput, styles.modalInputMultiline, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
            value={description}
            onChangeText={onDescriptionChange}
            placeholder="What is this budget for?"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            maxLength={200}
          />

          {/* Budget */}
          <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Spending Limit (optional)</Text>
          <View style={[styles.modalBudgetRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalCurrency, { color: colors.primary }]}>$</Text>
            <TextInput
              style={[styles.modalBudgetInput, { color: colors.textPrimary }]}
              value={budget}
              onChangeText={onBudgetChange}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Color */}
          <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Color</Text>
          <View style={styles.colorGrid}>
            {BUDGET_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorItem,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorItemSelected,
                ]}
                onPress={() => onColorChange(color)}
              >
                {selectedColor === color && (
                  <MaterialIcons name="check" size={18} color="#FFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Save as Template */}
          {!editingBudget && name.trim() !== '' && (
            <TouchableOpacity
              style={[styles.saveTemplateBtn, { borderColor: colors.primary, backgroundColor: `${colors.primary}14` }]}
              onPress={onSaveAsTemplate}
            >
              <MaterialIcons name="bookmark-add" size={20} color={colors.primary} />
              <Text style={[styles.saveTemplateBtnText, { color: colors.primary }]}>Save & Create as Template</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCancel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  modalSave: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '700',
  },
  modalContent: {
    padding: SPACING.lg,
  },
  modalLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  modalInput: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalBudgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCurrency: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.primary,
    fontWeight: '700',
    marginRight: SPACING.sm,
  },
  modalBudgetInput: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  colorItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorItemSelected: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  saveTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
  },
  saveTemplateBtnText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: '700',
  },
});
