import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { BudgetTemplate } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface BudgetTemplatesModalProps {
  visible: boolean;
  onClose: () => void;
  templates: BudgetTemplate[];
  onCreateFromTemplate: (templateId: string) => void;
  onDeleteTemplate: (template: BudgetTemplate) => void;
}

export const BudgetTemplatesModal: React.FC<BudgetTemplatesModalProps> = ({
  visible,
  onClose,
  templates,
  onCreateFromTemplate,
  onDeleteTemplate,
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
            <Text style={[styles.modalCancel, { color: colors.textMuted }]}>Close</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Budget Templates</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={[styles.templateSubtitle, { color: colors.textMuted }]}>
            Tap a template to create a budget from it. Long-press to delete.
          </Text>
          {templates.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.templateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
              onPress={() => onCreateFromTemplate(t.id)}
              onLongPress={() => onDeleteTemplate(t)}
            >
              <View style={[styles.templateDot, { backgroundColor: t.color }]} />
              <View style={styles.templateInfo}>
                <Text style={[styles.templateName, { color: colors.textPrimary }]}>{t.name}</Text>
                {t.description ? (
                  <Text style={[styles.templateDesc, { color: colors.textMuted }]} numberOfLines={1}>{t.description}</Text>
                ) : null}
              </View>
              {t.budget ? (
                <Text style={[styles.templateBudget, { color: t.color }]}>
                  {formatCurrency(t.budget)}
                </Text>
              ) : null}
              <MaterialIcons name="add-circle-outline" size={22} color={colors.textMuted} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ))}

          {templates.length === 0 && (
            <View style={styles.templateEmpty}>
              <MaterialIcons name="bookmark-border" size={40} color={colors.textMuted} />
              <Text style={[styles.templateEmptyText, { color: colors.textMuted }]}>
                No templates yet. Create a budget and choose "Save & Create as Template".
              </Text>
            </View>
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
  modalContent: {
    padding: SPACING.lg,
  },
  templateSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: SPACING.lg,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  templateDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.md,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  templateDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  templateBudget: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  templateEmpty: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  templateEmptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 260,
    marginTop: SPACING.md,
    lineHeight: 22,
  },
});
