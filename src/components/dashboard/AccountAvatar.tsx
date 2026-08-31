import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useTheme } from '../../contexts/ThemeContext';

interface AccountAvatarProps {
  onPress: () => void;
}

export const AccountAvatar: React.FC<AccountAvatarProps> = ({ onPress }) => {
  const { colors } = useTheme();
  const accounts = useExpenseStore((s) => s.accounts);
  const selectedAccountId = useExpenseStore((s) => s.selectedAccountId);

  const selectedAccount = selectedAccountId
    ? accounts.find((a) => a.id === selectedAccountId)
    : null;

  // "All Accounts" = primary color + layers icon, specific account = its color + icon
  const avatarColor = selectedAccount?.color || colors.primary;
  const avatarIcon = selectedAccount?.icon || 'layers';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={selectedAccount ? `Viewing ${selectedAccount.name}` : 'Viewing all accounts'}
      accessibilityRole="button"
      style={[styles.container, { borderColor: avatarColor }]}
    >
      <View style={[styles.inner, { backgroundColor: `${avatarColor}20` }]}>
        <MaterialIcons name={avatarIcon as any} size={22} color={avatarColor} />
      </View>
      <View style={[styles.activeDot, { borderColor: colors.background }]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00D68F',
    borderWidth: 2,
  },
});
