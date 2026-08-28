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
import { CalendarPicker } from '../CalendarPicker';

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

      <CalendarPicker
        visible={showDatePicker}
        date={date}
        onSelect={setDate}
        onClose={() => setShowDatePicker(false)}
        showQuickSelect
      />
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
});
