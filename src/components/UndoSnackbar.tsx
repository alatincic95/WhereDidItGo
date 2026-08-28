import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useUndoStore } from '../store/useUndoStore';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../constants/theme';

export const UndoSnackbar: React.FC = () => {
  const { colors } = useTheme();
  const current = useUndoStore((s) => s.current);
  const undo = useUndoStore((s) => s.undo);
  const dismiss = useUndoStore((s) => s.dismiss);

  const translateY = useRef(new Animated.Value(120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (current) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 120, duration: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [current?.id]);

  if (!current) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { opacity, transform: [{ translateY }] }]}
    >
      <View style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <MaterialIcons name="info-outline" size={20} color={colors.textSecondary} />
        <Text style={[styles.message, { color: colors.textPrimary }]} numberOfLines={1}>
          {current.message}
        </Text>
        <TouchableOpacity style={styles.actionBtn} onPress={undo} activeOpacity={0.7} accessibilityLabel="Undo" accessibilityRole="button">
          <Text style={[styles.actionText, { color: colors.primary }]}>UNDO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeBtn} onPress={dismiss} activeOpacity={0.7} accessibilityLabel="Dismiss" accessibilityRole="button">
          <MaterialIcons name="close" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 100,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 9999,
    elevation: 9999,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.sm,
    ...SHADOWS.medium,
  },
  message: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  actionBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    letterSpacing: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
