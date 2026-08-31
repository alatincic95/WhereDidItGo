import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';

interface QuickAction {
  label: string;
  icon: string;
  color: string;
  screen: string;
}

interface QuickActionsRowProps {
  navigation: any;
}

export const QuickActionsRow: React.FC<QuickActionsRowProps> = ({ navigation }) => {
  const { colors } = useTheme();

  const actions: QuickAction[] = [
    { label: 'Trends', icon: 'trending-up', color: colors.primary, screen: 'Trends' },
    { label: 'Goals', icon: 'savings', color: colors.success, screen: 'SavingsGoals' },
    { label: 'Income', icon: 'account-balance', color: colors.success, screen: 'IncomeList' },
    { label: 'Crypto', icon: 'currency-bitcoin', color: '#F7931A', screen: 'Crypto' },
    { label: 'Debt', icon: 'credit-score', color: colors.danger, screen: 'DebtPayoff' },
  ];

  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.screen}
          style={styles.item}
          activeOpacity={0.7}
          onPress={() => navigation.navigate(action.screen)}
        >
          <View style={[styles.iconCircle, { backgroundColor: `${action.color}18` }]}>
            <MaterialIcons name={action.icon as any} size={22} color={action.color} />
          </View>
          <Text
            style={[styles.label, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
