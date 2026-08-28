import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface CalendarPickerProps {
  visible: boolean;
  date: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
  title?: string;
  /** Show quick-select buttons for Today/Yesterday */
  showQuickSelect?: boolean;
  /** Minimum selectable date */
  minDate?: Date;
}

export const CalendarPicker: React.FC<CalendarPickerProps> = ({
  visible,
  date,
  onSelect,
  onClose,
  title = 'Select Date',
  showQuickSelect = false,
  minDate,
}) => {
  const { colors, isDark } = useTheme();
  const [viewYear, setViewYear] = useState(date.getFullYear());
  const [viewMonth, setViewMonth] = useState(date.getMonth());

  // Reset view when opened
  React.useEffect(() => {
    if (visible) {
      setViewYear(date.getFullYear());
      setViewMonth(date.getMonth());
    }
  }, [visible]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const isSelected = (day: number) => {
    return (
      date.getFullYear() === viewYear &&
      date.getMonth() === viewMonth &&
      date.getDate() === day
    );
  };

  const isToday = (day: number) => {
    const now = new Date();
    return (
      now.getFullYear() === viewYear &&
      now.getMonth() === viewMonth &&
      now.getDate() === day
    );
  };

  const isDisabled = (day: number) => {
    if (!minDate) return false;
    const d = new Date(viewYear, viewMonth, day);
    return d < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
  };

  const handleDayPress = (day: number) => {
    if (isDisabled(day)) return;
    const selected = new Date(viewYear, viewMonth, day, date.getHours(), date.getMinutes());
    onSelect(selected);
    onClose();
  };

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Build grid rows
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View
          style={[styles.container, { backgroundColor: isDark ? colors.backgroundCard : colors.surface, borderColor: colors.border }]}
          onStartShouldSetResponder={() => true}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>

          {/* Month nav */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} style={[styles.navBtn, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="chevron-left" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: colors.textPrimary }]}>{monthLabel}</Text>
            <TouchableOpacity onPress={nextMonth} style={[styles.navBtn, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="chevron-right" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Day-of-week headers */}
          <View style={styles.weekRow}>
            {DAYS_OF_WEEK.map((d) => (
              <Text key={d} style={[styles.weekDay, { color: colors.textMuted }]}>{d}</Text>
            ))}
          </View>

          {/* Day grid */}
          {rows.map((row, ri) => (
            <View key={ri} style={styles.weekRow}>
              {row.map((day, ci) => {
                if (day === null) {
                  return <View key={ci} style={styles.dayCell} />;
                }
                const selected = isSelected(day);
                const today = isToday(day);
                const disabled = isDisabled(day);
                return (
                  <TouchableOpacity
                    key={ci}
                    style={[
                      styles.dayCell,
                      selected && [styles.dayCellSelected, { backgroundColor: colors.primary }],
                      today && !selected && { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 20 },
                    ]}
                    onPress={() => handleDayPress(day)}
                    disabled={disabled}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { color: colors.textPrimary },
                        selected && { color: '#FFF', fontWeight: '700' },
                        disabled && { color: colors.textMuted, opacity: 0.4 },
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {/* Quick select */}
          {showQuickSelect && (
            <View style={styles.quickRow}>
              <TouchableOpacity
                style={[styles.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => { onSelect(new Date()); onClose(); }}
              >
                <Text style={[styles.quickText, { color: colors.textSecondary }]}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => {
                  const y = new Date();
                  y.setDate(y.getDate() - 1);
                  onSelect(y);
                  onClose();
                }}
              >
                <Text style={[styles.quickText, { color: colors.textSecondary }]}>Yesterday</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Done */}
          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.primary }]} onPress={onClose}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 360,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    paddingVertical: 6,
    letterSpacing: 0.5,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: 40,
  },
  dayCellSelected: {
    borderRadius: 20,
  },
  dayText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  quickRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    borderWidth: 1,
  },
  quickText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  doneBtn: {
    paddingVertical: SPACING.sm + 4,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  doneText: {
    fontSize: FONT_SIZE.md,
    color: '#FFF',
    fontWeight: '700',
  },
});
