import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
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

interface DatePickerSectionProps {
  date: Date;
  setDate: (val: Date) => void;
  showDatePicker: boolean;
  setShowDatePicker: (val: boolean) => void;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

export const DatePickerSection: React.FC<DatePickerSectionProps> = ({
  date,
  setDate,
  showDatePicker,
  setShowDatePicker,
  fadeAnim,
  slideAnim,
}) => {
  const { colors } = useTheme();

  return (
    <>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Date</Text>
        <TouchableOpacity
          style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.7}
          onPress={() => setShowDatePicker(true)}
        >
          <MaterialIcons name="calendar-today" size={20} color={colors.textMuted} />
          <Text style={[styles.dateText, { color: colors.textPrimary }]}>
            {date.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity
          style={styles.datePickerOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <View style={[styles.datePickerContainer, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <Text style={[styles.datePickerTitle, { color: colors.textPrimary }]}>Select Date</Text>
            <View style={styles.datePickerRow}>
              <TouchableOpacity
                style={[styles.datePickerArrow, { backgroundColor: colors.surface }]}
                onPress={() => setDate(new Date(date.getTime() - 86400000))}
              >
                <MaterialIcons name="chevron-left" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.datePickerValue, { color: colors.textPrimary }]}>
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
              <TouchableOpacity
                style={[styles.datePickerArrow, { backgroundColor: colors.surface }]}
                onPress={() => setDate(new Date(date.getTime() + 86400000))}
              >
                <MaterialIcons name="chevron-right" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.datePickerQuick}>
              <TouchableOpacity
                style={[styles.datePickerQuickBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setDate(new Date())}
              >
                <Text style={[styles.datePickerQuickText, { color: colors.textSecondary }]}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.datePickerQuickBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setDate(new Date(Date.now() - 86400000))}
              >
                <Text style={[styles.datePickerQuickText, { color: colors.textSecondary }]}>Yesterday</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.datePickerDoneBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.datePickerDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  dateText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: '85%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  datePickerTitle: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  datePickerArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerValue: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  datePickerQuick: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  datePickerQuickBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  datePickerQuickText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  datePickerDoneBtn: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  datePickerDoneText: {
    fontSize: FONT_SIZE.md,
    color: '#FFF',
    fontWeight: '700',
  },
});
