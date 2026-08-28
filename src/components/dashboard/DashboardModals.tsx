import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useExpenseStore } from '../../store/useExpenseStore';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { CURRENCY_OPTIONS, getCurrencySymbol } from '../../utils/currency';
import { exportCsv, exportBackup, pickAndReadBackupFile } from '../../utils/exportData';

interface DashboardModalsProps {
  // Income edit modal
  editingIncome: boolean;
  setEditingIncome: (v: boolean) => void;
  incomeInput: string;
  setIncomeInput: (v: string) => void;
  onSaveIncome: () => void;
  // Currency picker modal
  currencyPickerOpen: boolean;
  setCurrencyPickerOpen: (v: boolean) => void;
  // Exchange rate modal
  exchangeRateOpen: boolean;
  setExchangeRateOpen: (v: boolean) => void;
  newRateCurrency: string;
  setNewRateCurrency: (v: string) => void;
  newRateValue: string;
  setNewRateValue: (v: string) => void;
  // Backup menu modal
  backupMenuOpen: boolean;
  setBackupMenuOpen: (v: boolean) => void;
  // Hamburger menu modal
  hamburgerOpen: boolean;
  setHamburgerOpen: (v: boolean) => void;
  // Restore confirm modal
  restoreConfirmOpen: boolean;
  setRestoreConfirmOpen: (v: boolean) => void;
  pendingRestore: any;
  setPendingRestore: (v: any) => void;
  restoreMessage: string;
  setRestoreMessage: (v: string) => void;
  // Navigation
  navigation: any;
}

export const DashboardModals: React.FC<DashboardModalsProps> = ({
  editingIncome,
  setEditingIncome,
  incomeInput,
  setIncomeInput,
  onSaveIncome,
  currencyPickerOpen,
  setCurrencyPickerOpen,
  exchangeRateOpen,
  setExchangeRateOpen,
  newRateCurrency,
  setNewRateCurrency,
  newRateValue,
  setNewRateValue,
  backupMenuOpen,
  setBackupMenuOpen,
  hamburgerOpen,
  setHamburgerOpen,
  restoreConfirmOpen,
  setRestoreConfirmOpen,
  pendingRestore,
  setPendingRestore,
  restoreMessage,
  setRestoreMessage,
  navigation,
}) => {
  const { colors } = useTheme();
  const {
    currencySymbol,
    setCurrencySymbol,
    exchangeRates,
    addExchangeRate,
    deleteExchangeRate,
    expenses,
    incomes,
    fixedExpenses,
    fixedIncomes,
    getBackupState,
    restoreFromBackup,
  } = useExpenseStore();

  return (
    <>
      {/* Income Edit Modal (simple inline) */}
      {editingIncome && (
        <View style={styles.incomeOverlay}>
          <TouchableOpacity
            style={styles.incomeBackdrop}
            activeOpacity={1}
            onPress={() => setEditingIncome(false)}
          />
          <View style={[styles.incomeModal, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <Text style={[styles.incomeModalTitle, { color: colors.textPrimary }]}>Monthly Income</Text>
            <Text style={[styles.incomeModalSubtitle, { color: colors.textMuted }]}>
              How much do you earn per month?
            </Text>
            <View style={[styles.incomeInputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.incomeInputCurrency}>{currencySymbol}</Text>
              <TextInput
                style={[styles.incomeInput, { color: colors.textPrimary }]}
                value={incomeInput}
                onChangeText={setIncomeInput}
                keyboardType="decimal-pad"
                autoFocus
                selectTextOnFocus
              />
            </View>
            <View style={styles.incomeActions}>
              <TouchableOpacity
                style={[styles.incomeCancelBtn, { borderColor: colors.border }]}
                onPress={() => setEditingIncome(false)}
              >
                <Text style={[styles.incomeCancelText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.incomeSaveBtn} onPress={onSaveIncome}>
                <LinearGradient
                  colors={['#6C63FF', '#9B59B6']}
                  style={styles.incomeSaveGradient}
                >
                  <Text style={styles.incomeSaveText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Currency Picker Modal */}
      <Modal
        visible={currencyPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCurrencyPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.currencyOverlay}
          activeOpacity={1}
          onPress={() => setCurrencyPickerOpen(false)}
        >
          <View style={[styles.currencyModal, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <Text style={[styles.currencyModalTitle, { color: colors.textPrimary }]}>Currency</Text>
            <FlatList
              data={CURRENCY_OPTIONS}
              keyExtractor={(item) => item.symbol}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.currencyItem,
                    { borderBottomColor: colors.border },
                    currencySymbol === item.symbol && styles.currencyItemActive,
                  ]}
                  onPress={() => {
                    setCurrencySymbol(item.symbol);
                    setCurrencyPickerOpen(false);
                  }}
                >
                  <Text style={[
                    styles.currencyItemText,
                    { color: colors.textPrimary },
                    currencySymbol === item.symbol && { color: colors.primary },
                  ]}>
                    {item.label}
                  </Text>
                  {currencySymbol === item.symbol && (
                    <MaterialIcons name="check" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Exchange Rate Modal */}
      <Modal
        visible={exchangeRateOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setExchangeRateOpen(false)}
      >
        <TouchableOpacity
          style={styles.currencyOverlay}
          activeOpacity={1}
          onPress={() => setExchangeRateOpen(false)}
        >
          <View style={[styles.exchangeRateModal, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.currencyModalTitle, { color: colors.textPrimary }]}>Exchange Rates</Text>
            <Text style={[styles.exchangeRateSubtitle, { color: colors.textMuted }]}>
              Set how many {currencySymbol} (base) per 1 unit of foreign currency
            </Text>

            {/* Existing rates */}
            {exchangeRates.map((er) => (
              <View key={er.from} style={[styles.exchangeRateRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.exchangeRateInfo}>
                  <Text style={[styles.exchangeRateCode, { color: colors.textPrimary }]}>{getCurrencySymbol(er.from)} {er.from}</Text>
                  <Text style={[styles.exchangeRateValue, { color: colors.textMuted }]}>1 {er.from} = {er.rate} {currencySymbol}</Text>
                </View>
                <TouchableOpacity
                  style={styles.exchangeRateDeleteBtn}
                  onPress={() => deleteExchangeRate(er.from)}
                >
                  <MaterialIcons name="close" size={18} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}

            {exchangeRates.length === 0 && (
              <Text style={[styles.exchangeRateEmpty, { color: colors.textMuted }]}>
                No exchange rates yet. Add one below to track expenses in other currencies.
              </Text>
            )}

            {/* Add new rate */}
            <View style={[styles.exchangeRateAddSection, { borderTopColor: colors.border }]}>
              <Text style={[styles.exchangeRateAddLabel, { color: colors.textMuted }]}>Add Currency</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SPACING.sm }}>
                <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
                  {CURRENCY_OPTIONS
                    .filter((c) => !exchangeRates.some((r) => r.from === c.code))
                    .map((c) => (
                      <TouchableOpacity
                        key={c.code}
                        style={[
                          styles.exchangeRateChip,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          newRateCurrency === c.code && styles.exchangeRateChipSelected,
                        ]}
                        onPress={() => setNewRateCurrency(c.code)}
                      >
                        <Text style={[
                          styles.exchangeRateChipText,
                          { color: colors.textMuted },
                          newRateCurrency === c.code && { color: colors.primary },
                        ]}>
                          {c.symbol} {c.code}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </ScrollView>

              {newRateCurrency !== '' && (
                <View style={styles.exchangeRateInputRow}>
                  <Text style={[styles.exchangeRateInputLabel, { color: colors.textSecondary }]}>
                    1 {newRateCurrency} =
                  </Text>
                  <TextInput
                    style={[styles.exchangeRateInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                    value={newRateValue}
                    onChangeText={setNewRateValue}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                  <Text style={[styles.exchangeRateInputLabel, { color: colors.textSecondary }]}>{currencySymbol}</Text>
                  <TouchableOpacity
                    style={styles.exchangeRateAddBtn}
                    onPress={() => {
                      const val = parseFloat(newRateValue);
                      if (newRateCurrency && !isNaN(val) && val >= 0.0001 && val <= 999999) {
                        addExchangeRate({ from: newRateCurrency, rate: val });
                        setNewRateCurrency('');
                        setNewRateValue('');
                      }
                    }}
                  >
                    <MaterialIcons name="check" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.exchangeRateDoneBtn}
              onPress={() => setExchangeRateOpen(false)}
            >
              <Text style={styles.exchangeRateDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Hamburger Menu */}
      <Modal
        visible={hamburgerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setHamburgerOpen(false)}
      >
        <TouchableOpacity
          style={styles.backupOverlay}
          activeOpacity={1}
          onPress={() => setHamburgerOpen(false)}
        >
          <View style={[styles.backupModal, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.backupTitle, { color: colors.textPrimary }]}>Menu</Text>

            <TouchableOpacity
              style={styles.backupOption}
              onPress={() => { setHamburgerOpen(false); setCurrencyPickerOpen(true); }}
            >
              <View style={[styles.backupOptionIcon, { backgroundColor: `${colors.primary}1F` }]}>
                <Text style={{ fontSize: FONT_SIZE.lg, fontWeight: '700', color: colors.primary }}>{currencySymbol}</Text>
              </View>
              <View style={styles.backupOptionInfo}>
                <Text style={[styles.backupOptionTitle, { color: colors.textPrimary }]}>Base Currency</Text>
                <Text style={[styles.backupOptionDesc, { color: colors.textMuted }]}>Change your base currency</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backupOption}
              onPress={() => { setHamburgerOpen(false); setExchangeRateOpen(true); }}
            >
              <View style={[styles.backupOptionIcon, { backgroundColor: `${colors.success}1F` }]}>
                <MaterialIcons name="currency-exchange" size={20} color={colors.success} />
              </View>
              <View style={styles.backupOptionInfo}>
                <Text style={[styles.backupOptionTitle, { color: colors.textPrimary }]}>Exchange Rates</Text>
                <Text style={[styles.backupOptionDesc, { color: colors.textMuted }]}>Manage foreign currency rates</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backupOption}
              onPress={() => { setHamburgerOpen(false); setBackupMenuOpen(true); }}
            >
              <View style={[styles.backupOptionIcon, { backgroundColor: `${colors.warning}1F` }]}>
                <MaterialIcons name="save-alt" size={20} color={colors.warning} />
              </View>
              <View style={styles.backupOptionInfo}>
                <Text style={[styles.backupOptionTitle, { color: colors.textPrimary }]}>Backup & Export</Text>
                <Text style={[styles.backupOptionDesc, { color: colors.textMuted }]}>Backup, restore, or export your data</Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.backupDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.backupOption}
              onPress={() => { setHamburgerOpen(false); navigation.navigate('Settings' as never); }}
            >
              <View style={[styles.backupOptionIcon, { backgroundColor: 'rgba(187, 143, 206, 0.12)' }]}>
                <MaterialIcons name="settings" size={20} color="#BB8FCE" />
              </View>
              <View style={styles.backupOptionInfo}>
                <Text style={[styles.backupOptionTitle, { color: colors.textPrimary }]}>Settings</Text>
                <Text style={[styles.backupOptionDesc, { color: colors.textMuted }]}>Theme, security, categories, notifications</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Backup / Restore Menu */}
      <Modal
        visible={backupMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setBackupMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.backupOverlay}
          activeOpacity={1}
          onPress={() => setBackupMenuOpen(false)}
        >
          <View style={[styles.backupModal, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.backupTitle, { color: colors.textPrimary }]}>Backup & Export</Text>

            <TouchableOpacity
              style={styles.backupOption}
              onPress={async () => {
                setBackupMenuOpen(false);
                await exportBackup(getBackupState());
              }}
            >
              <View style={[styles.backupOptionIcon, { backgroundColor: `${colors.success}1F` }]}>
                <MaterialIcons name="backup" size={22} color={colors.success} />
              </View>
              <View style={styles.backupOptionInfo}>
                <Text style={[styles.backupOptionTitle, { color: colors.textPrimary }]}>Backup (JSON)</Text>
                <Text style={[styles.backupOptionDesc, { color: colors.textMuted }]}>Full backup of all data. Use to restore later.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backupOption}
              onPress={async () => {
                setBackupMenuOpen(false);
                const result = await pickAndReadBackupFile();
                if (!result.valid) {
                  setRestoreMessage(result.error);
                  setRestoreConfirmOpen(true);
                  return;
                }
                setPendingRestore(result.data);
                const count = result.data.expenses?.length || 0;
                const date = result.data._meta?.exportedAt
                  ? new Date(result.data._meta.exportedAt).toLocaleDateString()
                  : 'unknown date';
                setRestoreMessage(
                  `Restore backup from ${date}?\n\n` +
                  `${count} expenses, ${result.data.budgets?.length || 0} budgets, ` +
                  `${result.data.savingsGoals?.length || 0} goals.\n\n` +
                  `This will replace ALL current data.`
                );
                setRestoreConfirmOpen(true);
              }}
            >
              <View style={[styles.backupOptionIcon, { backgroundColor: `${colors.primary}1F` }]}>
                <MaterialIcons name="restore" size={22} color={colors.primary} />
              </View>
              <View style={styles.backupOptionInfo}>
                <Text style={[styles.backupOptionTitle, { color: colors.textPrimary }]}>Restore from Backup</Text>
                <Text style={[styles.backupOptionDesc, { color: colors.textMuted }]}>Import a JSON backup file.</Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.backupDivider, { backgroundColor: colors.border }]} />

            <TouchableOpacity
              style={styles.backupOption}
              onPress={() => {
                setBackupMenuOpen(false);
                exportCsv({ expenses, incomes, fixedExpenses, fixedIncomes });
              }}
            >
              <View style={[styles.backupOptionIcon, { backgroundColor: `${colors.warning}1F` }]}>
                <MaterialIcons name="table-chart" size={22} color={colors.warning} />
              </View>
              <View style={styles.backupOptionInfo}>
                <Text style={[styles.backupOptionTitle, { color: colors.textPrimary }]}>Export CSV</Text>
                <Text style={[styles.backupOptionDesc, { color: colors.textMuted }]}>Spreadsheet-friendly format (read-only).</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Restore Confirmation */}
      <Modal
        visible={restoreConfirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setRestoreConfirmOpen(false);
          setPendingRestore(null);
        }}
      >
        <TouchableOpacity
          style={styles.backupOverlay}
          activeOpacity={1}
          onPress={() => {
            setRestoreConfirmOpen(false);
            setPendingRestore(null);
          }}
        >
          <View style={[styles.restoreModal, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]} onStartShouldSetResponder={() => true}>
            <MaterialIcons
              name={pendingRestore ? 'restore' : 'error-outline'}
              size={36}
              color={pendingRestore ? colors.primary : colors.danger}
            />
            <Text style={[styles.restoreTitle, { color: colors.textPrimary }]}>
              {pendingRestore ? 'Restore Data?' : 'Error'}
            </Text>
            <Text style={[styles.restoreMessage, { color: colors.textSecondary }]}>{restoreMessage}</Text>

            <View style={styles.restoreActions}>
              <TouchableOpacity
                style={[styles.restoreCancelBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setRestoreConfirmOpen(false);
                  setPendingRestore(null);
                }}
              >
                <Text style={[styles.restoreCancelText, { color: colors.textMuted }]}>
                  {pendingRestore ? 'Cancel' : 'OK'}
                </Text>
              </TouchableOpacity>
              {pendingRestore && (
                <TouchableOpacity
                  style={styles.restoreConfirmBtn}
                  onPress={() => {
                    restoreFromBackup(pendingRestore);
                    setRestoreConfirmOpen(false);
                    setPendingRestore(null);
                  }}
                >
                  <LinearGradient
                    colors={['#6C63FF', '#9B59B6']}
                    style={styles.restoreConfirmGradient}
                  >
                    <Text style={styles.restoreConfirmText}>Restore</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Income Edit Modal
  incomeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  incomeBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  incomeModal: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: '85%',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.large,
  },
  incomeModalTitle: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '800',
    marginBottom: 4,
  },
  incomeModalSubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: SPACING.lg,
  },
  incomeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  incomeInputCurrency: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: '700',
    marginRight: SPACING.sm,
  },
  incomeInput: {
    flex: 1,
    fontSize: 28,
    color: COLORS.textPrimary,
    fontWeight: '800',
  },
  incomeActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  incomeCancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  incomeCancelText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  incomeSaveBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  incomeSaveGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  incomeSaveText: {
    fontSize: FONT_SIZE.md,
    color: '#FFF',
    fontWeight: '700',
  },

  // Currency Picker
  currencyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyModal: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    width: '80%',
    maxHeight: '60%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currencyModalTitle: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '800',
    marginBottom: SPACING.md,
  },
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  currencyItemActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
  },
  currencyItemText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },

  // Exchange Rate Modal
  exchangeRateModal: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exchangeRateSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: SPACING.lg,
  },
  exchangeRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exchangeRateInfo: { flex: 1 },
  exchangeRateCode: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  exchangeRateValue: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  exchangeRateDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 61, 113, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exchangeRateEmpty: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
    textAlign: 'center',
    marginVertical: SPACING.lg,
    fontStyle: 'italic',
  },
  exchangeRateAddSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  exchangeRateAddLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  exchangeRateChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exchangeRateChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
  },
  exchangeRateChipText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  exchangeRateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  exchangeRateInputLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  exchangeRateInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: 'center',
  },
  exchangeRateAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exchangeRateDoneBtn: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  exchangeRateDoneText: {
    fontSize: FONT_SIZE.md,
    color: '#FFF',
    fontWeight: '700',
  },

  // Backup / Restore
  backupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backupModal: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    width: '88%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backupTitle: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '800',
    marginBottom: SPACING.lg,
  },
  backupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  backupOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backupOptionInfo: {
    flex: 1,
  },
  backupOptionTitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  backupOptionDesc: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  backupDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },

  // Restore Confirmation
  restoreModal: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    width: '85%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  restoreTitle: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textPrimary,
    fontWeight: '800',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  restoreMessage: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  restoreActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  restoreCancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  restoreCancelText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  restoreConfirmBtn: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  restoreConfirmGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
  },
  restoreConfirmText: {
    fontSize: FONT_SIZE.md,
    color: '#FFF',
    fontWeight: '700',
  },
});
