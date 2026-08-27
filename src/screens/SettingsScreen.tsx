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
import * as LocalAuthentication from 'expo-local-authentication';
import { GlassCard } from '../components/GlassCard';
import { useExpenseStore } from '../store/useExpenseStore';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';
import { requestPermissions, cancelAllScheduled } from '../utils/localNotifications';
import { getApiKey, setApiKey, removeApiKey } from '../assistant/config';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark, toggle } = useTheme();
  const biometricEnabled = useExpenseStore((s) => s.biometricEnabled);
  const setBiometricEnabled = useExpenseStore((s) => s.setBiometricEnabled);
  const pushNotificationsEnabled = useExpenseStore((s) => s.pushNotificationsEnabled);
  const setPushNotificationsEnabled = useExpenseStore((s) => s.setPushNotificationsEnabled);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometrics');
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>APPEARANCE</Text>
        <GlassCard style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, { backgroundColor: isDark ? 'rgba(108, 99, 255, 0.12)' : 'rgba(108, 99, 255, 0.08)' }]}>
                <MaterialIcons name={isDark ? 'dark-mode' : 'light-mode'} size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>Dark Mode</Text>
                <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                  {isDark ? 'Dark theme active' : 'Light theme active'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFF"
            />
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
                  {apiKeyConfigured ? 'Key configured' : 'Required for AI assistant'}
                </Text>
              </View>
            </View>
            {apiKeyConfigured ? (
              <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
                <TouchableOpacity onPress={() => { setApiKeyInput(apiKeyValue); setShowApiKeyModal(true); }}>
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
