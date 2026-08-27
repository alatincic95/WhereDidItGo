import React from 'react';
import {
  View,
  Text,
  TextInput,
  Animated,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
} from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface AmountInputProps {
  amount: string;
  setAmount: (val: string) => void;
  currencySymbol: string;
  fadeAnim: Animated.Value;
  amountScale: Animated.Value;
  onFocus: () => void;
  onBlur: () => void;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  amount,
  setAmount,
  currencySymbol,
  fadeAnim,
  amountScale,
  onFocus,
  onBlur,
}) => {
  const { colors } = useTheme();

  return (
    <Animated.View
      style={[
        styles.amountSection,
        {
          opacity: fadeAnim,
          transform: [{ scale: amountScale }],
        },
      ]}
    >
      <Text style={[styles.amountLabel, { color: colors.textMuted }]}>Amount</Text>
      <View style={styles.amountRow}>
        <Text style={[styles.currencySymbol, { color: colors.primary }]}>{currencySymbol}</Text>
        <TextInput
          style={[styles.amountInput, { color: colors.textPrimary }]}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>
      <View style={styles.amountLine}>
        <LinearGradient
          colors={['#6C63FF', '#BB8FCE', '#FF6B9D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.amountLineGradient}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  amountSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  amountLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currencySymbol: {
    fontSize: 28,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 8,
    marginRight: 4,
  },
  amountInput: {
    fontSize: 56,
    color: COLORS.textPrimary,
    fontWeight: '800',
    letterSpacing: -2,
    minWidth: 120,
    textAlign: 'center',
  },
  amountLine: {
    width: 200,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  amountLineGradient: {
    flex: 1,
  },
});
