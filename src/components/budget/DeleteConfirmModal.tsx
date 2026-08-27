import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
} from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface DeleteConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
}) => {
  const { colors } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={styles.deleteConfirmOverlay}
        activeOpacity={1}
        onPress={onCancel}
      >
        <View style={[styles.deleteConfirmContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.deleteConfirmTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.deleteConfirmMessage, { color: colors.textSecondary }]}>{message}</Text>
          <View style={styles.deleteConfirmButtons}>
            <TouchableOpacity
              style={[styles.deleteConfirmCancelBtn, { backgroundColor: colors.background }]}
              onPress={onCancel}
            >
              <Text style={[styles.deleteConfirmCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteConfirmDeleteBtn, { backgroundColor: `${colors.danger}18` }]}
              onPress={onConfirm}
            >
              <Text style={[styles.deleteConfirmDeleteText, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
});
