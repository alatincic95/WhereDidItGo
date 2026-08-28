import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useExpenseStore } from '../../store/useExpenseStore';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { getCurrencySymbol } from '../../utils/currency';
import { CategoryIcon } from '../CategoryIcon';
import { ExpenseTemplate } from '../../types';

export const ExpenseTemplatesRow: React.FC = () => {
  const { colors } = useTheme();
  const expenseTemplates = useExpenseStore((s) => s.expenseTemplates);
  const addExpenseFromTemplate = useExpenseStore((s) => s.addExpenseFromTemplate);
  const deleteExpenseTemplate = useExpenseStore((s) => s.deleteExpenseTemplate);
  const currencySymbol = useExpenseStore((s) => s.currencySymbol);

  const [confirmTemplate, setConfirmTemplate] = useState<ExpenseTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseTemplate | null>(null);
  const [showAdded, setShowAdded] = useState<string | null>(null);

  if (expenseTemplates.length === 0) return null;

  const handleTap = (template: ExpenseTemplate) => {
    addExpenseFromTemplate(template.id);
    setShowAdded(template.id);
    setTimeout(() => setShowAdded(null), 1500);
  };

  const handleLongPress = (template: ExpenseTemplate) => {
    setDeleteTarget(template);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteExpenseTemplate(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const getSymbol = (template: ExpenseTemplate) => {
    return template.currency ? getCurrencySymbol(template.currency) : currencySymbol;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="bolt" size={18} color={colors.warning} />
        <Text style={[styles.title, { color: colors.textMuted }]}>Quick Templates</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {expenseTemplates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={[
              styles.chip,
              {
                backgroundColor: colors.surface,
                borderColor: showAdded === template.id ? colors.success : colors.border,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => handleTap(template)}
            onLongPress={() => handleLongPress(template)}
          >
            {showAdded === template.id ? (
              <MaterialIcons name="check-circle" size={20} color={colors.success} />
            ) : (
              <CategoryIcon category={template.category} size={20} />
            )}
            <View style={styles.chipText}>
              <Text style={[styles.chipName, { color: colors.textPrimary }]} numberOfLines={1}>
                {template.name}
              </Text>
              <Text style={[styles.chipAmount, { color: colors.textSecondary }]}>
                {getSymbol(template)}{template.amount.toFixed(2)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteTarget} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.backgroundCard }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Delete Template?</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Remove "{deleteTarget?.name}" template?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.surface }]}
                onPress={() => setDeleteTarget(null)}
              >
                <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: `${colors.danger}18` }]}
                onPress={handleDelete}
              >
                <Text style={[styles.modalBtnText, { color: colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.textMuted,
  },
  scrollContent: {
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipText: {
    gap: 1,
  },
  chipName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    maxWidth: 100,
  },
  chipAmount: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  modalMessage: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});
