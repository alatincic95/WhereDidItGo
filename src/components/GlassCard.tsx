import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING } from '../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glowColor?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  glowColor = COLORS.primary,
  intensity = 'medium',
}) => {
  const glowOpacity = intensity === 'high' ? 0.3 : intensity === 'medium' ? 0.15 : 0.08;

  return (
    <View style={[styles.container, style]}>
      {/* Glow effect behind the card */}
      <View
        style={[
          styles.glow,
          {
            backgroundColor: glowColor,
            opacity: glowOpacity,
          },
        ]}
      />
      {/* Glass surface */}
      <View style={styles.glass}>
        <View style={styles.innerBorder} />
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
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: BORDER_RADIUS.xl,
    transform: [{ scale: 1.02 }],
  },
  glass: {
    backgroundColor: 'rgba(22, 33, 62, 0.85)',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.15)',
    padding: SPACING.lg,
    overflow: 'hidden',
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
