import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { ViewMode } from './helpers';

interface HeroBalanceCardProps {
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  heroLabel: string;
  heroBalance: number;
  totalIncomeThisMonth: number;
  totalSpentThisMonth: number;
  trackedMonths: string[];
  safeToSpendDaily?: number;
  daysLeft?: number;
  formatCurrency: (amount: number) => string;
}

export const HeroBalanceCard: React.FC<HeroBalanceCardProps> = ({
  viewMode,
  onToggleViewMode,
  heroLabel,
  heroBalance,
  totalIncomeThisMonth,
  totalSpentThisMonth,
  trackedMonths,
  safeToSpendDaily,
  daysLeft,
  formatCurrency,
}) => {
  const heroGradient: [string, string, string] =
    viewMode === 'monthly'
      ? ['#6C63FF', '#9B59B6', '#FF6B9D']
      : ['#00D68F', '#45B7D1', '#6C63FF'];

  const showSafeToSpend = viewMode === 'monthly' && safeToSpendDaily !== undefined && safeToSpendDaily > 0;

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onToggleViewMode}>
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
            {/* View mode label */}
            <Text style={styles.heroLabel}>{heroLabel}</Text>

            {/* Main balance */}
            <Text
              style={styles.heroAmount}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {formatCurrency(heroBalance)}
            </Text>

            {/* Stats row */}
            <View style={styles.statsRow}>
              {viewMode === 'monthly' ? (
                <>
                  <View style={styles.statPill}>
                    <MaterialIcons name="trending-up" size={14} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.statText}>{formatCurrency(totalIncomeThisMonth)}</Text>
                  </View>
                  <View style={styles.statPill}>
                    <MaterialIcons name="trending-down" size={14} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.statText}>{formatCurrency(totalSpentThisMonth)}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.statPill}>
                  <MaterialIcons name="history" size={14} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.statText}>
                    {trackedMonths.length} month{trackedMonths.length !== 1 ? 's' : ''} tracked
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Tap hint */}
          <View style={styles.tapHint}>
            <MaterialIcons name="swap-horiz" size={12} color="rgba(255,255,255,0.85)" />
            <Text style={styles.tapHintText}>Tap to switch</Text>
          </View>

          {/* Mode chips */}
          <View style={styles.modeChips}>
            <View style={[styles.modeChip, viewMode === 'monthly' && styles.modeChipActive]}>
              <MaterialIcons name="calendar-month" size={12} color={viewMode === 'monthly' ? '#FFFFFF' : 'rgba(255,255,255,0.45)'} />
              <Text style={[styles.modeText, viewMode === 'monthly' && styles.modeTextActive]}>Monthly</Text>
            </View>
            <View style={[styles.modeChip, viewMode === 'overall' && styles.modeChipActive]}>
              <MaterialIcons name="all-inclusive" size={12} color={viewMode === 'overall' ? '#FFFFFF' : 'rgba(255,255,255,0.45)'} />
              <Text style={[styles.modeText, viewMode === 'overall' && styles.modeTextActive]}>Overall</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
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
    paddingBottom: 48,
    overflow: 'hidden',
    minHeight: 180,
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
  modeChips: {
    position: 'absolute',
    bottom: 12,
    left: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 80,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  modeChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  modeText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 11,
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#FFFFFF',
  },
  heroAmount: {
    fontSize: 42,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: SPACING.sm,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.round,
    gap: 5,
  },
  statText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  tapHint: {
    position: 'absolute',
    bottom: 12,
    right: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tapHintText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    fontWeight: '600',
  },
});
