import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';

interface QuickActionsRowProps {
  navigation: any;
}

export const QuickActionsRow: React.FC<QuickActionsRowProps> = ({ navigation }) => {
  const { colors } = useTheme();
  return (
    <>
      <TouchableOpacity
        style={[styles.quickActionCard, { borderColor: `${colors.primary}1A` }]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Trends')}
      >
        <LinearGradient
          colors={[`${colors.primary}26`, `${colors.primary}14`]}
          style={styles.quickActionGradient}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: `${colors.primary}26` }]}>
            <MaterialIcons name="trending-up" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>Trends</Text>
          <MaterialIcons name="chevron-right" size={18} color={colors.textMuted} />
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.quickActionCard, { borderColor: `${colors.success}1A` }]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('SavingsGoals')}
      >
        <LinearGradient
          colors={[`${colors.success}26`, `${colors.success}14`]}
          style={styles.quickActionGradient}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: `${colors.success}26` }]}>
            <MaterialIcons name="savings" size={22} color={colors.success} />
          </View>
          <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>Goals</Text>
          <MaterialIcons name="chevron-right" size={18} color={colors.textMuted} />
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.quickActionCard, { borderColor: `${colors.success}1A` }]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('IncomeList')}
      >
        <LinearGradient
          colors={[`${colors.success}26`, `${colors.success}0D`]}
          style={styles.quickActionGradient}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: `${colors.success}26` }]}>
            <MaterialIcons name="account-balance" size={22} color={colors.success} />
          </View>
          <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>Income</Text>
          <MaterialIcons name="chevron-right" size={18} color={colors.textMuted} />
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.quickActionCard, { borderColor: '#F7931A1A' }]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Crypto')}
      >
        <LinearGradient
          colors={['#F7931A26', '#F7931A14']}
          style={styles.quickActionGradient}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#F7931A26' }]}>
            <MaterialIcons name="currency-bitcoin" size={22} color="#F7931A" />
          </View>
          <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>Crypto</Text>
          <MaterialIcons name="chevron-right" size={18} color={colors.textMuted} />
        </LinearGradient>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  quickActionCard: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.1)',
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
});
