import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { GlassCard } from '../components/GlassCard';
import { useExpenseStore } from '../store/useExpenseStore';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { requestPermissions, cancelAllScheduled } from '../utils/localNotifications';
import { getApiKey, setApiKey, removeApiKey, maskApiKey } from '../assistant/config';
import { syncExchangeRates } from '../utils/currencyFetch';
import { signOut as firebaseSignOut } from '../services/firebase';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark, mode: themeMode, setMode: setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();
  const biometricEnabled = useExpenseStore((s) => s.biometricEnabled);
  const setBiometricEnabled = useExpenseStore((s) => s.setBiometricEnabled);
  const pushNotificationsEnabled = useExpenseStore((s) => s.pushNotificationsEnabled);
  const setPushNotificationsEnabled = useExpenseStore((s) => s.setPushNotificationsEnabled);
  const autoBackupReminder = useExpenseStore((s) => s.autoBackupReminder);
  const setAutoBackupReminder = useExpenseStore((s) => s.setAutoBackupReminder);
  const monthlyIncome = useExpenseStore((s) => s.monthlyIncome);
  const setMonthlyIncome = useExpenseStore((s) => s.setMonthlyIncome);
  const currencySymbol = useExpenseStore((s) => s.currencySymbol);
  const resetAllData = useExpenseStore((s) => s.resetAllData);
  const autoBackupEnabled = useExpenseStore((s) => s.autoBackupEnabled);
  const setAutoBackupEnabled = useExpenseStore((s) => s.setAutoBackupEnabled);
  const autoBackupFrequency = useExpenseStore((s) => s.autoBackupFrequency);
  const setAutoBackupFrequency = useExpenseStore((s) => s.setAutoBackupFrequency);
  const useRecurringAsMonthlyIncome = useExpenseStore((s) => s.useRecurringAsMonthlyIncome);
  const setUseRecurringAsMonthlyIncome = useExpenseStore((s) => s.setUseRecurringAsMonthlyIncome);
  const fixedIncomesTotal = useExpenseStore((s) => s.getFixedIncomesTotal());
  const reminderLeadDays = useExpenseStore((s) => s.reminderLeadDays);
  const setReminderLeadDays = useExpenseStore((s) => s.setReminderLeadDays);
  const isSignedIn = useExpenseStore((s) => s.isSignedIn);
  const userEmail = useExpenseStore((s) => s.userEmail);
  const clearAuth = useExpenseStore((s) => s.clearAuth);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometrics');
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [ratesSyncing, setRatesSyncing] = useState(false);
  const [ratesSyncResult, setRatesSyncResult] = useState<'success' | 'error' | null>(null);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetFinal, setShowResetFinal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  useEffect(() => {
    checkBiometric();
    loadApiKeyStatus();
  }, []);

  const loadApiKeyStatus = async () => {
    const key = await getApiKey();
    if (key) {
      setApiKeyConfigured(true);
      setApiKeyValue(key);
    }
  };

  const handleSaveApiKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (trimmed) {
      await setApiKey(trimmed);
      setApiKeyConfigured(true);
      setApiKeyValue(trimmed);
    }
    setApiKeyInput('');
    setShowApiKeyModal(false);
  };

  const handleRemoveApiKey = async () => {
    await removeApiKey();
    setApiKeyConfigured(false);
    setApiKeyValue('');
  };

  const checkBiometric = async () => {
    if (Platform.OS === 'web') return;
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      setBiometricType('Face ID');
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      setBiometricType('Fingerprint');
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Enable ${biometricType} lock`,
        fallbackLabel: 'Use passcode',
      });
      if (result.success) {
        setBiometricEnabled(true);
      }
    } else {
      setBiometricEnabled(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut();
    } catch {
      // Firebase may not be initialized; still clear local state
    }
    clearAuth();
  };

  const handlePushToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestPermissions();
      if (granted) {
        setPushNotificationsEnabled(true);
      }
    } else {
      setPushNotificationsEnabled(false);
      cancelAllScheduled();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityLabel="Go back" accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Account */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ACCOUNT</Text>
        {isSignedIn ? (
          <>
            <GlassCard style={styles.card}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View style={[styles.settingIcon, { backgroundColor: 'rgba(0, 214, 143, 0.12)' }]}>
                    <MaterialIcons name="check-circle" size={22} color={colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Signed In</Text>
                    <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                      {userEmail || 'Unknown email'}
                    </Text>
                  </View>
                </View>
              </View>
            </GlassCard>
            <GlassCard style={styles.card}>
              <TouchableOpacity style={styles.settingRow} onPress={handleSignOut}>
                <View style={styles.settingInfo}>
                  <View style={[styles.settingIcon, { backgroundColor: `${colors.danger}15` }]}>
                    <MaterialIcons name="logout" size={22} color={colors.danger} />
                  </View>
                  <Text style={[styles.settingTitle, { color: colors.danger }]}>Sign Out</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </GlassCard>
          </>
        ) : (
          <GlassCard style={styles.card}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => (navigation as any).navigate('Auth')}
            >
              <View style={styles.settingInfo}>
                <View style={[styles.settingIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <MaterialIcons name="person" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Sign In / Create Account</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Optional - prepares for cloud sync</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>APPEARANCE</Text>
        <GlassCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(108, 99, 255, 0.12)' : 'rgba(108, 99, 255, 0.08)' }]}>
                <MaterialIcons
                  name={themeMode === 'system' ? 'brightness-auto' : isDark ? 'dark-mode' : 'light-mode'}
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Theme</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  {themeMode === 'system' ? 'Following system' : isDark ? 'Dark theme' : 'Light theme'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.themeSelectorRow}>
            {([
              ['light', 'light-mode', 'Light'],
              ['dark', 'dark-mode', 'Dark'],
              ['system', 'brightness-auto', 'System'],
            ] as const).map(([mode, icon, label]) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.themeOption,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  themeMode === mode && { borderColor: colors.primary, backgroundColor: `${colors.primary}15` },
                ]}
                onPress={() => setThemeMode(mode)}
              >
                <MaterialIcons
                  name={icon as any}
                  size={18}
                  color={themeMode === mode ? colors.primary : colors.textMuted}
                />
                <Text style={[
                  styles.themeOptionText,
                  { color: colors.textMuted },
                  themeMode === mode && { color: colors.primary },
                ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Customize Dashboard */}
        <GlassCard style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('DashboardCustomize' as never)}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(69, 183, 209, 0.12)' : 'rgba(69, 183, 209, 0.08)' }]}>
                <MaterialIcons name="dashboard-customize" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Customize Dashboard</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  Reorder or hide dashboard cards
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        {/* Categories */}
        <GlassCard style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('ReorderCategories' as never)}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(255, 170, 0, 0.12)' : 'rgba(255, 170, 0, 0.08)' }]}>
                <MaterialIcons name="swap-vert" size={22} color={colors.warning} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Reorder Categories</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  Prioritize category order in lists and forms
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        {/* Category Budgets */}
        <GlassCard style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('CategoryBudgets' as never)}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(0, 214, 143, 0.12)' : 'rgba(0, 214, 143, 0.08)' }]}>
                <MaterialIcons name="pie-chart" size={22} color={colors.success} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Category Budgets</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  Set monthly spending limits per category
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        {/* Tax Report */}
        <GlassCard style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('TaxReport' as never)}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(0, 214, 143, 0.12)' : 'rgba(0, 214, 143, 0.08)' }]}>
                <MaterialIcons name="receipt-long" size={22} color={colors.success} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Tax Report</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  View and export tax-deductible expenses
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        {/* Net Worth */}
        <GlassCard style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('NetWorth' as never)}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(108, 99, 255, 0.12)' : 'rgba(108, 99, 255, 0.08)' }]}>
                <MaterialIcons name="assessment" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Net Worth</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  Track assets, liabilities, and net worth over time
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        {/* Cash Flow Forecast */}
        <GlassCard style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('CashFlowForecast' as never)}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(69, 183, 209, 0.12)' : 'rgba(69, 183, 209, 0.08)' }]}>
                <MaterialIcons name="timeline" size={22} color="#45B7D1" />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Cash Flow Forecast</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  Project your balance up to 12 months ahead
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        {/* Currency */}
        <GlassCard style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={async () => {
              setRatesSyncing(true);
              setRatesSyncResult(null);
              const ok = await syncExchangeRates();
              setRatesSyncResult(ok ? 'success' : 'error');
              setRatesSyncing(false);
              setTimeout(() => setRatesSyncResult(null), 3000);
            }}
            disabled={ratesSyncing}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(78, 205, 196, 0.12)' : 'rgba(78, 205, 196, 0.08)' }]}>
                <MaterialIcons name="currency-exchange" size={22} color="#4ECDC4" />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Sync Exchange Rates</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  {ratesSyncing ? 'Fetching latest rates...' :
                   ratesSyncResult === 'success' ? 'Rates updated!' :
                   ratesSyncResult === 'error' ? 'Failed to fetch rates' :
                   'Fetch latest rates from the internet'}
                </Text>
              </View>
            </View>
            <MaterialIcons
              name={ratesSyncing ? 'hourglass-top' : ratesSyncResult === 'success' ? 'check-circle' : 'sync'}
              size={22}
              color={ratesSyncResult === 'success' ? colors.success : ratesSyncResult === 'error' ? colors.danger : colors.textMuted}
            />
          </TouchableOpacity>
        </GlassCard>

        {/* Accounts */}
        <GlassCard style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('Accounts' as never)}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(108, 99, 255, 0.12)' : 'rgba(108, 99, 255, 0.08)' }]}>
                <MaterialIcons name="account-balance" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Accounts & Wallets</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  Manage bank, cash, and credit card accounts
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        {/* Financial */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>FINANCIAL</Text>
        <GlassCard style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              setIncomeInput(monthlyIncome.toString());
              setShowIncomeModal(true);
            }}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(0, 214, 143, 0.12)' : 'rgba(0, 214, 143, 0.08)' }]}>
                <MaterialIcons name="account-balance-wallet" size={22} color={colors.success} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Monthly Income</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  {currencySymbol}{monthlyIncome.toLocaleString()}
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        {/* Monthly Income Modal */}
        <Modal visible={showIncomeModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Monthly Income</Text>
              <View style={[styles.apiKeyInputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={{ color: colors.textMuted, fontSize: FONT_SIZE.md, marginRight: 4 }}>{currencySymbol}</Text>
                <TextInput
                  style={[styles.apiKeyInput, { color: colors.textPrimary }]}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  value={incomeInput}
                  onChangeText={setIncomeInput}
                  keyboardType="numeric"
                  autoFocus
                />
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.background }]}
                  onPress={() => setShowIncomeModal(false)}
                >
                  <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    const parsed = parseFloat(incomeInput);
                    if (!isNaN(parsed) && parsed >= 0) {
                      setMonthlyIncome(parsed);
                    }
                    setShowIncomeModal(false);
                  }}
                >
                  <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Variable Income */}
        <GlassCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(130, 224, 170, 0.12)' : 'rgba(130, 224, 170, 0.08)' }]}>
                <MaterialIcons name="sync-alt" size={22} color="#82E0AA" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Use Recurring as Income</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  {useRecurringAsMonthlyIncome
                    ? `Based on recurring: ${currencySymbol}${fixedIncomesTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo`
                    : 'Use recurring incomes instead of fixed amount'}
                </Text>
              </View>
            </View>
            <Switch
              value={useRecurringAsMonthlyIncome}
              onValueChange={setUseRecurringAsMonthlyIncome}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor="#FFF"
            />
          </View>
        </GlassCard>

        {/* AI Assistant */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>AI ASSISTANT</Text>
        <GlassCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(0, 188, 212, 0.12)' : 'rgba(0, 188, 212, 0.08)' }]}>
                <MaterialIcons name="smart-toy" size={22} color="#00BCD4" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Gemini API Key</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  {apiKeyConfigured ? maskApiKey(apiKeyValue) : 'Required for AI assistant'}
                </Text>
              </View>
            </View>
            {apiKeyConfigured ? (
              <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
                <TouchableOpacity onPress={() => { setApiKeyInput(''); setShowApiKeyModal(true); }}>
                  <MaterialIcons name="edit" size={20} color={colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleRemoveApiKey}>
                  <MaterialIcons name="delete-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setShowApiKeyModal(true)}
                style={[styles.addKeyBtn, { backgroundColor: colors.primary + '15' }]}
              >
                <Text style={[styles.addKeyBtnText, { color: colors.primary }]}>Add Key</Text>
              </TouchableOpacity>
            )}
          </View>
        </GlassCard>
        <Text style={[styles.apiKeyHint, { color: colors.textMuted }]}>
          Get your free API key at aistudio.google.com (no credit card needed)
        </Text>

        {/* API Key Modal */}
        <Modal visible={showApiKeyModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Gemini API Key</Text>
              <View style={[styles.apiKeyInputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.apiKeyInput, { color: colors.textPrimary }]}
                  placeholder="AIza..."
                  placeholderTextColor={colors.textMuted}
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  secureTextEntry={!showApiKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)}>
                  <MaterialIcons name={showApiKey ? 'visibility-off' : 'visibility'} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.background }]}
                  onPress={() => { setApiKeyInput(''); setShowApiKeyModal(false); }}
                >
                  <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSaveApiKey}
                >
                  <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Security */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SECURITY</Text>
        <GlassCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(0, 214, 143, 0.12)' : 'rgba(0, 214, 143, 0.08)' }]}>
                <MaterialIcons name="fingerprint" size={22} color={colors.success} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>{biometricType} Lock</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  {!biometricAvailable && Platform.OS !== 'web'
                    ? 'Not available on this device'
                    : Platform.OS === 'web'
                    ? 'Not available on web'
                    : biometricEnabled
                    ? 'Require authentication to open app'
                    : 'Protect your financial data'}
                </Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor="#FFF"
              disabled={!biometricAvailable || Platform.OS === 'web'}
            />
          </View>
        </GlassCard>

        {/* Notifications */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>NOTIFICATIONS</Text>
        <GlassCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(69, 183, 209, 0.12)' : 'rgba(69, 183, 209, 0.08)' }]}>
                <MaterialIcons name="notifications-active" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Push Notifications</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  {Platform.OS === 'web'
                    ? 'Not available on web'
                    : pushNotificationsEnabled
                    ? 'Receive alerts when app is closed'
                    : 'Get budget alerts and bill reminders'}
                </Text>
              </View>
            </View>
            <Switch
              value={pushNotificationsEnabled}
              onValueChange={handlePushToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFF"
              disabled={Platform.OS === 'web'}
            />
          </View>
        </GlassCard>

        {/* Reminder Lead Days */}
        <GlassCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(255, 170, 0, 0.12)' : 'rgba(255, 170, 0, 0.08)' }]}>
                <MaterialIcons name="event" size={22} color={colors.warning} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Bill Reminder Lead Time</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  Notify {reminderLeadDays} day{reminderLeadDays !== 1 ? 's' : ''} before due date
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.themeSelectorRow}>
            {([1, 2, 3, 5, 7] as const).map((days) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.themeOption,
                  { backgroundColor: colors.background, borderColor: colors.border },
                  reminderLeadDays === days && { borderColor: colors.primary, backgroundColor: `${colors.primary}15` },
                ]}
                onPress={() => setReminderLeadDays(days)}
              >
                <Text style={[
                  styles.themeOptionText,
                  { color: colors.textMuted },
                  reminderLeadDays === days && { color: colors.primary },
                ]}>
                  {days}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Data */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>DATA</Text>
        <GlassCard style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('DataTransfer' as never)}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(255, 170, 0, 0.12)' : 'rgba(255, 170, 0, 0.08)' }]}>
                <MaterialIcons name="sync" size={22} color={colors.warning} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Backup & Transfer</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  Cloud backup, restore, and device transfer
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        <GlassCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(69, 183, 209, 0.12)' : 'rgba(69, 183, 209, 0.08)' }]}>
                <MaterialIcons name="backup" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Backup Reminder</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  {autoBackupReminder ? 'Weekly reminder enabled' : 'Get reminded to back up your data'}
                </Text>
              </View>
            </View>
            <Switch
              value={autoBackupReminder}
              onValueChange={setAutoBackupReminder}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFF"
              disabled={!pushNotificationsEnabled}
            />
          </View>
        </GlassCard>

        {/* Auto Backup */}
        <GlassCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(0, 214, 143, 0.12)' : 'rgba(0, 214, 143, 0.08)' }]}>
                <MaterialIcons name="cloud-done" size={22} color={colors.success} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Auto Backup</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  {autoBackupEnabled ? 'Saves to device automatically' : 'Automatically save backup copies'}
                </Text>
              </View>
            </View>
            <Switch
              value={autoBackupEnabled}
              onValueChange={setAutoBackupEnabled}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor="#FFF"
            />
          </View>
          {autoBackupEnabled && (
            <View style={[styles.themeSelectorRow, { marginTop: SPACING.sm }]}>
              {([
                ['daily', 'Daily'],
                ['every5', 'Every 5'],
                ['every10', 'Every 10'],
                ['every20', 'Every 20'],
              ] as const).map(([freq, label]) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.themeOption,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    autoBackupFrequency === freq && { borderColor: colors.primary, backgroundColor: `${colors.primary}15` },
                  ]}
                  onPress={() => setAutoBackupFrequency(freq)}
                >
                  <Text style={[
                    styles.themeOptionText,
                    { color: colors.textMuted },
                    autoBackupFrequency === freq && { color: colors.primary },
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </GlassCard>

        <GlassCard style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowResetConfirm(true)}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(255, 69, 58, 0.12)' : 'rgba(255, 69, 58, 0.08)' }]}>
                <MaterialIcons name="delete-forever" size={22} color={colors.danger} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.danger }]}>Reset All Data</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  Delete all financial data and start fresh
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>

        {/* Reset Confirmation Modal - Step 1 */}
        <Modal visible={showResetConfirm} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Reset All Data?</Text>
              <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZE.md, marginBottom: SPACING.lg, lineHeight: 22 }}>
                Are you sure? This will delete all your financial data permanently, including expenses, income, budgets, savings goals, and settings.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.background }]}
                  onPress={() => setShowResetConfirm(false)}
                >
                  <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.danger }]}
                  onPress={() => {
                    setShowResetConfirm(false);
                    setResetConfirmText('');
                    setShowResetFinal(true);
                  }}
                >
                  <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Yes, Reset</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Reset Confirmation Modal - Step 2 (Final) */}
        <Modal visible={showResetFinal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>This Cannot Be Undone</Text>
              <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZE.md, marginBottom: SPACING.md, lineHeight: 22 }}>
                Type <Text style={{ fontWeight: '700', color: colors.danger }}>RESET</Text> to confirm deletion of all data.
              </Text>
              <View style={[styles.apiKeyInputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.apiKeyInput, { color: colors.textPrimary }]}
                  placeholder="Type RESET"
                  placeholderTextColor={colors.textMuted}
                  value={resetConfirmText}
                  onChangeText={setResetConfirmText}
                  autoCapitalize="characters"
                  autoFocus
                />
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.background }]}
                  onPress={() => {
                    setShowResetFinal(false);
                    setResetConfirmText('');
                  }}
                >
                  <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: colors.danger, opacity: resetConfirmText === 'RESET' ? 1 : 0.4 }]}
                  onPress={async () => {
                    if (resetConfirmText === 'RESET') {
                      await resetAllData();
                      setShowResetFinal(false);
                      setResetConfirmText('');
                    }
                  }}
                  disabled={resetConfirmText !== 'RESET'}
                >
                  <Text style={[styles.modalBtnText, { color: '#FFF' }]}>Delete Everything</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* About */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ABOUT</Text>
        <GlassCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(255, 107, 157, 0.12)' : 'rgba(255, 107, 157, 0.08)' }]}>
                <MaterialIcons name="info-outline" size={22} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>WhereDidItGo</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>Version 1.0.0</Text>
              </View>
            </View>
          </View>
        </GlassCard>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
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
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  sectionLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
    marginLeft: SPACING.xs,
  },
  card: {
    marginBottom: SPACING.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  settingSubtitle: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1.5,
  },
  themeOptionText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  addKeyBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
  },
  addKeyBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  apiKeyHint: {
    fontSize: FONT_SIZE.xs,
    marginLeft: SPACING.xs,
    marginBottom: SPACING.sm,
    marginTop: -4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  apiKeyInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  apiKeyInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    paddingVertical: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});
