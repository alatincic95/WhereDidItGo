import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';
import { formatCurrency } from '../../utils/currency';
import { ACCOUNT_TYPE_LABELS } from '../../types';

interface AccountSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({
  visible,
  onClose,
}) => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const accounts = useExpenseStore((s) => s.accounts);
  const selectedAccountId = useExpenseStore((s) => s.selectedAccountId);
  const setSelectedAccountId = useExpenseStore((s) => s.setSelectedAccountId);
  const setDefaultAccount = useExpenseStore((s) => s.setDefaultAccount);
  const getAccountBalance = useExpenseStore((s) => s.getAccountBalance);
  const getCreditCardInfo = useExpenseStore((s) => s.getCreditCardInfo);

  const totalBalance = accounts.reduce((sum, a) => sum + getAccountBalance(a.id), 0);
  const isAllSelected = selectedAccountId === null;

  const handleSelect = (id: string | null) => {
    setSelectedAccountId(id);
  };

  const handleSetDefault = (id: string) => {
    setDefaultAccount(id);
  };

  const navigateAndClose = (params?: Record<string, any>) => {
    onClose();
    setTimeout(() => {
      navigation.navigate('Accounts', params);
    }, 150);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Handle bar */}
          <View style={styles.handleBar}>
            <View style={[styles.handle, { backgroundColor: colors.textMuted }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Accounts</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <MaterialIcons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
            bounces={false}
          >
            {/* All Accounts option */}
            <TouchableOpacity
              style={[
                styles.activeCard,
                {
                  backgroundColor: isAllSelected
                    ? (isDark ? 'rgba(108,99,255,0.12)' : 'rgba(108,99,255,0.06)')
                    : 'transparent',
                  borderColor: isAllSelected ? `${colors.primary}40` : colors.border,
                },
              ]}
              onPress={() => handleSelect(null)}
              activeOpacity={0.6}
            >
              <View style={[styles.accountIcon, { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}35` }]}>
                <MaterialIcons name="layers" size={22} color={colors.primary} />
              </View>
              <View style={styles.accountInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.accountName, { color: colors.textPrimary }]}>All Accounts</Text>
                  {isAllSelected && (
                    <View style={[styles.activeBadge, { backgroundColor: `${colors.primary}18` }]}>
                      <Text style={[styles.activeBadgeText, { color: colors.primary }]}>Viewing</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.accountType, { color: colors.textMuted }]}>
                  {accounts.length} account{accounts.length !== 1 ? 's' : ''} combined
                </Text>
              </View>
              <Text style={[styles.balance, { color: totalBalance >= 0 ? colors.success : colors.danger }]}>
                {formatCurrency(totalBalance)}
              </Text>
            </TouchableOpacity>

            {/* Individual accounts */}
            {accounts.map((account) => {
              const bal = getAccountBalance(account.id);
              const ccInfo = account.type === 'credit_card' ? getCreditCardInfo(account.id) : null;
              const isSelected = selectedAccountId === account.id;
              return (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountRow,
                    { borderBottomColor: colors.border },
                    isSelected && {
                      backgroundColor: `${account.color}10`,
                      borderRadius: BORDER_RADIUS.md,
                      marginHorizontal: -SPACING.xs,
                      paddingHorizontal: SPACING.xs,
                      borderBottomWidth: 0,
                    },
                  ]}
                  onPress={() => handleSelect(account.id)}
                  onLongPress={() => handleSetDefault(account.id)}
                  activeOpacity={0.6}
                >
                  <View style={[styles.accountIcon, { backgroundColor: `${account.color}18`, borderColor: `${account.color}30` }]}>
                    <MaterialIcons name={account.icon as any} size={20} color={account.color} />
                  </View>
                  <View style={styles.accountInfo}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.accountName, { color: colors.textPrimary }]}>{account.name}</Text>
                      {account.isDefault && (
                        <View style={[styles.defaultBadge, { backgroundColor: `${colors.success}15` }]}>
                          <Text style={[styles.activeBadgeText, { color: colors.success }]}>Default</Text>
                        </View>
                      )}
                      {isSelected && (
                        <MaterialIcons name="check-circle" size={16} color={account.color} />
                      )}
                    </View>
                    <Text style={[styles.accountType, { color: colors.textMuted }]}>
                      {ACCOUNT_TYPE_LABELS[account.type]}
                      {ccInfo && ccInfo.limit > 0 ? ` · ${formatCurrency(ccInfo.available)} avail` : ''}
                    </Text>
                  </View>
                  {ccInfo ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.balance, { color: colors.danger }]}>
                        {formatCurrency(ccInfo.owed)}
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '600', color: colors.textMuted }}>owed</Text>
                    </View>
                  ) : (
                    <Text style={[styles.balance, { color: bal >= 0 ? colors.success : colors.danger }]}>
                      {formatCurrency(bal)}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}

            {accounts.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No accounts yet. Add one to get started.
              </Text>
            )}
            {accounts.length > 1 && (
              <Text style={[styles.hintText, { color: colors.textMuted }]}>
                Long-press an account to set it as default for new transactions
              </Text>
            )}
          </ScrollView>

          {/* Action buttons */}
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(108,99,255,0.1)' : 'rgba(108,99,255,0.06)' }]}
              onPress={() => navigateAndClose()}
            >
              <MaterialIcons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>Add Account</Text>
            </TouchableOpacity>
            {accounts.length >= 2 && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(0,214,143,0.1)' : 'rgba(0,214,143,0.06)' }]}
                onPress={() => navigateAndClose({ openTransfer: true })}
              >
                <MaterialIcons name="swap-horiz" size={20} color={colors.success} />
                <Text style={[styles.actionText, { color: colors.success }]}>Transfer</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
              onPress={() => navigateAndClose()}
            >
              <MaterialIcons name="settings" size={20} color={colors.textSecondary} />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>Manage All</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  handleBar: {
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  scroll: {
    paddingHorizontal: SPACING.lg,
  },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  accountIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  accountName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  accountType: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
  },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.round,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balance: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    padding: SPACING.xl,
    fontSize: FONT_SIZE.sm,
  },
  hintText: {
    textAlign: 'center',
    fontSize: FONT_SIZE.xs,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    marginTop: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  actionText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
});
