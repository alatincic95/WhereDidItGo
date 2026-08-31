import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';

interface CryptoSummaryCardProps {
  portfolioValue: number;
  holdingsCount: number;
  formatCurrency: (amount: number) => string;
  onPress: () => void;
}

export const CryptoSummaryCard: React.FC<CryptoSummaryCardProps> = ({
  portfolioValue,
  holdingsCount,
  formatCurrency,
  onPress,
}) => {
  const { colors, isDark } = useTheme();

  if (holdingsCount === 0) return null;

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? 'rgba(22, 33, 62, 0.85)' : colors.backgroundCard,
            borderColor: isDark ? 'rgba(247, 147, 26, 0.25)' : colors.border,
          },
        ]}
      >
        <View style={styles.row}>
          <View style={[styles.iconDot, { backgroundColor: '#F7931A18' }]}>
            <MaterialIcons name="currency-bitcoin" size={18} color="#F7931A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.textMuted }]}>Crypto Portfolio</Text>
            <Text
              style={[styles.amount, { color: colors.textPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatCurrency(portfolioValue)}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { color: colors.textMuted }]}>
              {holdingsCount} coin{holdingsCount !== 1 ? 's' : ''}
            </Text>
            <MaterialIcons name="chevron-right" size={16} color={colors.textMuted} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconDot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  amount: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  badgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
});
