import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { ViewMode } from './helpers';

interface HeroBalanceCardProps {
  viewMode: ViewMode;
  heroLabel: string;
  heroBalance: number;
  totalSpentThisMonth: number;
  trackedMonths: string[];
  formatCurrency: (amount: number) => string;
}

export const HeroBalanceCard: React.FC<HeroBalanceCardProps> = ({
  viewMode,
  heroLabel,
  heroBalance,
  totalSpentThisMonth,
  trackedMonths,
  formatCurrency,
}) => {
  const heroGradient: [string, string, string] =
    viewMode === 'monthly'
      ? ['#6C63FF', '#9B59B6', '#FF6B9D']
      : ['#00D68F', '#45B7D1', '#6C63FF'];

  return (
    <View style={styles.heroCard}>
      <LinearGradient
        colors={heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={[styles.heroCircle, styles.heroCircle1]} />
        <View style={[styles.heroCircle, styles.heroCircle2]} />
        <View style={[styles.heroCircle, styles.heroCircle3]} />

        <View style={styles.heroContent}>
          <Text style={styles.heroLabel}>{heroLabel}</Text>
          <Text style={styles.heroAmount}>{formatCurrency(heroBalance)}</Text>

          {viewMode === 'monthly' ? (
            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <MaterialIcons name="trending-down" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroMetaText}>
                  {formatCurrency(totalSpentThisMonth)} spent
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <MaterialIcons name="history" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroMetaText}>
                  {trackedMonths.length} month{trackedMonths.length !== 1 ? 's' : ''} tracked
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.sparkleContainer}>
          <Text style={styles.sparkle}>✦</Text>
          <Text style={[styles.sparkle, styles.sparkle2]}>✦</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.glow,
  },
  heroGradient: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    overflow: 'hidden',
    minHeight: 170,
  },
  heroCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  heroCircle1: { width: 200, height: 200, top: -60, right: -40 },
  heroCircle2: { width: 120, height: 120, bottom: -30, left: -20 },
  heroCircle3: { width: 80, height: 80, top: 20, right: 80 },
  heroContent: { zIndex: 1 },
  heroLabel: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  heroAmount: {
    fontSize: 44,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: SPACING.md,
  },
  heroMeta: { flexDirection: 'row' },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
    gap: 6,
  },
  heroMetaText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  sparkleContainer: { position: 'absolute', top: 16, right: 20 },
  sparkle: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 16 },
  sparkle2: { position: 'absolute', top: 20, left: -15, fontSize: 10, color: 'rgba(255, 255, 255, 0.25)' },
});
