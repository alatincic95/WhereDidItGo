import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { useExpenseStore } from '../store/useExpenseStore';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS, COLORS } from '../constants/theme';
import { formatCurrency } from '../utils/currency';
import {
  Account,
  AccountType,
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPE_ICONS,
  BUDGET_COLORS,
} from '../types';

const ACCOUNT_TYPES: AccountType[] = ['cash', 'bank', 'credit_card', 'savings', 'investment', 'other'];
const ACCOUNT_ICONS = ['payments', 'account-balance', 'credit-card', 'savings', 'trending-up', 'wallet', 'store', 'home', 'work', 'attach-money'];

export const AccountsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    setDefaultAccount,
    getAccountBalance,
    transfers,
  } = useExpenseStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [balance, setBalance] = useState('');
  const [selectedColor, setSelectedColor] = useState(BUDGET_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState('account-balance');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');

  const totalBalance = accounts.reduce((sum, a) => sum + getAccountBalance(a.id), 0);

  useEffect(() => {
    if (route.params?.openTransfer && accounts.length >= 2) {
      setTransferFrom(accounts[0].id);
      setTransferTo(accounts[1].id);
      setShowTransferModal(true);
    }
  }, []);

  const openModal = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setName(account.name);
      setType(account.type);
      setBalance(account.balance.toString());
      setSelectedColor(account.color);
      setSelectedIcon(account.icon);
    } else {
      setEditingAccount(null);
      setName('');
      setType('bank');
      setBalance('0');
      setSelectedColor(BUDGET_COLORS[0]);
      setSelectedIcon('account-balance');
    }
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const data = {
      name: name.trim(),
      type,
      balance: parseFloat(balance) || 0,
      color: selectedColor,
      icon: selectedIcon,
      isDefault: editingAccount?.isDefault || false,
    };
    if (editingAccount) {
      updateAccount(editingAccount.id, data);
    } else {
      addAccount(data);
    }
    setModalVisible(false);
  };

  const handleTransfer = () => {
    if (!transferFrom || !transferTo || transferFrom === transferTo) return;
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) return;
    useExpenseStore.getState().addTransfer({
      fromAccountId: transferFrom,
      toAccountId: transferTo,
      amount,
      description: transferDesc.trim() || undefined,
      date: new Date().toISOString(),
    });
    setShowTransferModal(false);
    setTransferAmount('');
    setTransferDesc('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Accounts</Text>
        <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              if (accounts.length >= 2) {
                setTransferFrom(accounts[0].id);
                setTransferTo(accounts[1].id);
                setShowTransferModal(true);
              }
            }}
          >
            <MaterialIcons name="swap-horiz" size={22} color={accounts.length >= 2 ? colors.primary : colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openModal()}
            style={[styles.backBtn, { backgroundColor: colors.primary }]}
          >
            <MaterialIcons name="add" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Total Balance */}
        <GlassCard style={styles.totalCard} glowColor={COLORS.primary} intensity="medium">
          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Total Balance</Text>
          <Text style={[styles.totalAmount, { color: colors.textPrimary }]}>{formatCurrency(totalBalance)}</Text>
          <Text style={[styles.totalSub, { color: colors.textMuted }]}>{accounts.length} account{accounts.length !== 1 ? 's' : ''}</Text>
        </GlassCard>

        {/* Account Cards */}
        {accounts.map((account) => {
          const bal = getAccountBalance(account.id);
          return (
            <TouchableOpacity
              key={account.id}
              onPress={() => openModal(account)}
              activeOpacity={0.7}
            >
              <GlassCard style={styles.accountCard}>
                <View style={styles.accountRow}>
                  <View style={[styles.accountIcon, { backgroundColor: `${account.color}18`, borderColor: `${account.color}30` }]}>
                    <MaterialIcons name={account.icon as any} size={24} color={account.color} />
                  </View>
                  <View style={styles.accountInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                      <Text style={[styles.accountName, { color: colors.textPrimary }]}>{account.name}</Text>
                      {account.isDefault && (
                        <View style={[styles.defaultBadge, { backgroundColor: `${colors.primary}15` }]}>
                          <Text style={[styles.defaultBadgeText, { color: colors.primary }]}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.accountType, { color: colors.textMuted }]}>
                      {ACCOUNT_TYPE_LABELS[account.type]}
                    </Text>
                  </View>
                  <Text style={[styles.accountBalance, { color: bal >= 0 ? colors.success : colors.danger }]}>
                    {formatCurrency(bal)}
                  </Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}

        {/* Recent Transfers */}
        {transfers.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Transfers</Text>
            {transfers.slice(0, 10).map((t) => {
              const from = accounts.find((a) => a.id === t.fromAccountId);
              const to = accounts.find((a) => a.id === t.toAccountId);
              return (
                <GlassCard key={t.id} style={styles.transferCard}>
                  <View style={styles.transferRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.transferNames, { color: colors.textPrimary }]}>
                        {from?.name || 'Unknown'} → {to?.name || 'Unknown'}
                      </Text>
                      {t.description && (
                        <Text style={[styles.transferDesc, { color: colors.textMuted }]}>{t.description}</Text>
                      )}
                      <Text style={[styles.transferDate, { color: colors.textMuted }]}>
                        {new Date(t.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={[styles.transferAmount, { color: colors.textPrimary }]}>{formatCurrency(t.amount)}</Text>
                  </View>
                </GlassCard>
              );
            })}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Add/Edit Account Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={[styles.modalCancel, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editingAccount ? 'Edit Account' : 'New Account'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              value={name}
              onChangeText={setName}
              placeholder="Account name"
              placeholderTextColor={colors.textMuted}
              autoFocus
              maxLength={30}
            />

            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Type</Text>
            <View style={styles.chipGrid}>
              {ACCOUNT_TYPES.map((t) => {
                const isSelected = type === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.chip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isSelected && { borderColor: colors.primary, backgroundColor: `${colors.primary}15` },
                    ]}
                    onPress={() => setType(t)}
                  >
                    <MaterialIcons name={ACCOUNT_TYPE_ICONS[t] as any} size={18} color={isSelected ? colors.primary : colors.textMuted} />
                    <Text style={[styles.chipText, { color: colors.textSecondary }, isSelected && { color: colors.primary }]}>
                      {ACCOUNT_TYPE_LABELS[t]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Initial Balance</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              value={balance}
              onChangeText={setBalance}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Color</Text>
            <View style={styles.colorRow}>
              {BUDGET_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotSelected]}
                  onPress={() => setSelectedColor(c)}
                />
              ))}
            </View>

            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Icon</Text>
            <View style={styles.chipGrid}>
              {ACCOUNT_ICONS.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  style={[
                    styles.iconChip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    selectedIcon === ic && { borderColor: selectedColor, backgroundColor: `${selectedColor}15` },
                  ]}
                  onPress={() => setSelectedIcon(ic)}
                >
                  <MaterialIcons name={ic as any} size={22} color={selectedIcon === ic ? selectedColor : colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Make Default / Delete */}
            {editingAccount && !editingAccount.isDefault && (
              <TouchableOpacity
                style={[styles.actionBtn, { marginTop: SPACING.xl }]}
                onPress={() => {
                  setDefaultAccount(editingAccount.id);
                  setModalVisible(false);
                }}
              >
                <MaterialIcons name="star" size={20} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>Set as Default</Text>
              </TouchableOpacity>
            )}
            {editingAccount && !editingAccount.isDefault && accounts.length > 1 && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setShowDeleteConfirm(true)}
              >
                <MaterialIcons name="delete-outline" size={20} color={COLORS.danger} />
                <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>Delete Account</Text>
              </TouchableOpacity>
            )}
            {editingAccount && editingAccount.isDefault && accounts.length > 1 && (
              <Text style={{ color: colors.textMuted, fontSize: FONT_SIZE.xs, textAlign: 'center', marginTop: SPACING.lg }}>
                Set another account as default first to delete this one
              </Text>
            )}
          </ScrollView>

          {/* Delete Confirm Overlay (inside edit modal so it renders on top) */}
          {showDeleteConfirm && (
            <View style={[styles.overlay, StyleSheet.absoluteFill]}>
              <View style={[styles.confirmBox, { backgroundColor: colors.surface }]}>
                <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>Delete Account?</Text>
                <Text style={{ color: colors.textSecondary, marginBottom: SPACING.lg }}>
                  Transactions will be moved to the default account.
                </Text>
                <View style={styles.confirmBtns}>
                  <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.background }]} onPress={() => setShowDeleteConfirm(false)}>
                    <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmBtn, { backgroundColor: 'rgba(255,61,113,0.12)' }]}
                    onPress={() => {
                      if (editingAccount) deleteAccount(editingAccount.id);
                      setShowDeleteConfirm(false);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={{ color: COLORS.danger, fontWeight: '600' }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Transfer Modal */}
      <Modal visible={showTransferModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.confirmBox, { backgroundColor: colors.surface, width: '90%' }]}>
            <Text style={[styles.confirmTitle, { color: colors.textPrimary }]}>Transfer Between Accounts</Text>

            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>From</Text>
            <View style={styles.chipGrid}>
              {accounts.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    transferFrom === a.id && { borderColor: a.color, backgroundColor: `${a.color}15` },
                  ]}
                  onPress={() => setTransferFrom(a.id)}
                >
                  <MaterialIcons name={a.icon as any} size={16} color={transferFrom === a.id ? a.color : colors.textMuted} />
                  <Text style={[styles.chipText, { color: colors.textSecondary }, transferFrom === a.id && { color: a.color }]}>{a.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>To</Text>
            <View style={styles.chipGrid}>
              {accounts.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    transferTo === a.id && { borderColor: a.color, backgroundColor: `${a.color}15` },
                  ]}
                  onPress={() => setTransferTo(a.id)}
                >
                  <MaterialIcons name={a.icon as any} size={16} color={transferTo === a.id ? a.color : colors.textMuted} />
                  <Text style={[styles.chipText, { color: colors.textSecondary }, transferTo === a.id && { color: a.color }]}>{a.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Amount</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              value={transferAmount}
              onChangeText={setTransferAmount}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>Note (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              value={transferDesc}
              onChangeText={setTransferDesc}
              placeholder="e.g., ATM withdrawal"
              placeholderTextColor={colors.textMuted}
              maxLength={100}
            />

            <View style={[styles.confirmBtns, { marginTop: SPACING.lg }]}>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.background }]} onPress={() => setShowTransferModal(false)}>
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.primary }]} onPress={handleTransfer}>
                <Text style={{ color: '#FFF', fontWeight: '600' }}>Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  totalCard: { marginBottom: SPACING.lg, alignItems: 'center', paddingVertical: SPACING.xl },
  totalLabel: { fontSize: FONT_SIZE.xs, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  totalAmount: { fontSize: FONT_SIZE.xxxl, fontWeight: '800', letterSpacing: -1 },
  totalSub: { fontSize: FONT_SIZE.sm, marginTop: 4 },
  accountCard: { marginBottom: SPACING.sm },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  accountIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  accountInfo: { flex: 1 },
  accountName: { fontSize: FONT_SIZE.lg, fontWeight: '600' },
  accountType: { fontSize: FONT_SIZE.sm, marginTop: 2 },
  accountBalance: { fontSize: FONT_SIZE.xl, fontWeight: '700' },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BORDER_RADIUS.round },
  defaultBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginTop: SPACING.lg, marginBottom: SPACING.sm },
  transferCard: { marginBottom: SPACING.xs },
  transferRow: { flexDirection: 'row', alignItems: 'center' },
  transferNames: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  transferDesc: { fontSize: FONT_SIZE.sm, marginTop: 2 },
  transferDate: { fontSize: FONT_SIZE.xs, marginTop: 2 },
  transferAmount: { fontSize: FONT_SIZE.lg, fontWeight: '700' },

  // Modal
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, borderBottomWidth: 1 },
  modalCancel: { fontSize: FONT_SIZE.md, fontWeight: '600' },
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700' },
  modalSave: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  modalContent: { padding: SPACING.lg },
  modalLabel: { fontSize: FONT_SIZE.sm, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: SPACING.sm, marginTop: SPACING.lg },
  input: { borderRadius: BORDER_RADIUS.md, padding: SPACING.md, fontSize: FONT_SIZE.md, borderWidth: 1 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.round, borderWidth: 1.5, gap: 6 },
  chipText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  iconChip: { width: 44, height: 44, borderRadius: BORDER_RADIUS.md, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: '#FFF' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.lg, gap: SPACING.xs },
  actionBtnText: { fontSize: FONT_SIZE.md, fontWeight: '600' },

  // Overlays
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  confirmBox: { borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, maxWidth: 400 },
  confirmTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.sm },
  confirmBtns: { flexDirection: 'row', gap: SPACING.sm },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
});
