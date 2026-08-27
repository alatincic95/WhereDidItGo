import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
} from 'react-native';
import {
  COLORS,
  SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
} from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { ExchangeRate } from '../../types';
import { getCurrencySymbol } from '../../utils/currency';

interface CurrencySelectorProps {
  exchangeRates: ExchangeRate[];
  expenseCurrency: string | undefined;
  setExpenseCurrency: (val: string | undefined) => void;
  currencySymbol: string;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  exchangeRates,
  expenseCurrency,
  setExpenseCurrency,
  currencySymbol,
  fadeAnim,
  slideAnim,
}) => {
  const { colors } = useTheme();

  if (exchangeRates.length === 0) return null;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Currency</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: SPACING.md }}
      >
        <TouchableOpacity
          style={[
            styles.currencyChip,
            { backgroundColor: colors.surface, borderColor: colors.border },
            !expenseCurrency && { borderColor: colors.primary, backgroundColor: `${colors.primary}1F` },
          ]}
          onPress={() => setExpenseCurrency(undefined)}
        >
          <Text
            style={[
              styles.currencyChipText,
              { color: colors.textMuted },
              !expenseCurrency && { color: colors.primary },
            ]}
          >
            {currencySymbol} Base
          </Text>
        </TouchableOpacity>
        {exchangeRates.map((er) => {
          const isSelected = expenseCurrency === er.from;
          return (
            <TouchableOpacity
              key={er.from}
              style={[
                styles.currencyChip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isSelected && { borderColor: colors.primary, backgroundColor: `${colors.primary}1F` },
              ]}
              onPress={() => setExpenseCurrency(er.from)}
            >
              <Text
                style={[
                  styles.currencyChipText,
                  { color: colors.textMuted },
                  isSelected && { color: colors.primary },
                ]}
              >
                {getCurrencySymbol(er.from)} {er.from}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
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
  currencyChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  currencyChipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
