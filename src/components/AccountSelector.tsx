import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useExpenseStore } from '../store/useExpenseStore';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

interface AccountSelectorProps {
  selectedAccountId?: string;
  onSelect: (accountId: string) => void;
}

export const AccountSelector: React.FC<AccountSelectorProps> = ({ selectedAccountId, onSelect }) => {
  const { colors } = useTheme();
  const accounts = useExpenseStore((s) => s.accounts);

  const isNoneSelected = selectedAccountId === 'none';

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>Account</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.chip,
            { backgroundColor: colors.surface, borderColor: colors.border },
            isNoneSelected && { borderColor: colors.textMuted, backgroundColor: `${colors.textMuted}15` },
          ]}
          onPress={() => onSelect('none')}
        >
          <MaterialIcons
            name="block"
            size={16}
            color={isNoneSelected ? colors.textPrimary : colors.textMuted}
          />
          <Text
            style={[
              styles.chipText,
              { color: colors.textSecondary },
              isNoneSelected && { color: colors.textPrimary },
            ]}
          >
            None
          </Text>
        </TouchableOpacity>
        {accounts.map((account) => {
          const isSelected = !isNoneSelected && account.id === selectedAccountId;
          return (
            <TouchableOpacity
              key={account.id}
              style={[
                styles.chip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isSelected && { borderColor: account.color, backgroundColor: `${account.color}15` },
              ]}
              onPress={() => onSelect(account.id)}
            >
              <MaterialIcons
                name={account.icon as any}
                size={16}
                color={isSelected ? account.color : colors.textMuted}
              />
              <Text
                style={[
                  styles.chipText,
                  { color: colors.textSecondary },
                  isSelected && { color: account.color },
                ]}
                numberOfLines={1}
              >
                {account.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1.5,
    gap: 6,
  },
  chipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    maxWidth: 80,
  },
});
