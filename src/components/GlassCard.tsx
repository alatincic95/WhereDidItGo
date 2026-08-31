import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { BORDER_RADIUS, SPACING } from '../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glowColor?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  glowColor,
  intensity = 'medium',
}) => {
  const { colors, isDark } = useTheme();
  const color = glowColor || colors.primary;
  const glowOpacity = intensity === 'high' ? 0.12 : intensity === 'medium' ? 0.06 : 0.03;

  return (
    <View style={[styles.container, style]}>
      <View style={[
        styles.glass,
        {
          backgroundColor: isDark ? 'rgba(22, 33, 62, 0.85)' : colors.backgroundCard,
          borderColor: isDark ? 'rgba(108, 99, 255, 0.15)' : colors.border,
        },
      ]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: BORDER_RADIUS.xl,
  },
  glass: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    overflow: 'hidden',
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});
