import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Platform, Keyboard, TouchableWithoutFeedback, AppState } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { useExpenseStore } from './src/store/useExpenseStore';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { UndoSnackbar } from './src/components/UndoSnackbar';
import { KeyboardOverlay } from './src/components/KeyboardOverlay';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { scheduleBillReminders, scheduleMonthlyRecap, scheduleBackupReminder, scheduleDueDateReminders } from './src/utils/localNotifications';
import { buildWidgetData, syncWidgetData } from './src/utils/widgetData';
import { performAutoBackup, rotateBackups, shouldAutoBackup } from './src/utils/autoBackup';

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function BiometricGate({ children }: { children: React.ReactNode }) {
  const biometricEnabled = useExpenseStore((s) => s.biometricEnabled);
  const { colors, isDark } = useTheme();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    authenticate();
  }, []);

  // Re-lock after returning from background if >5 minutes elapsed
  useEffect(() => {
    if (!biometricEnabled || Platform.OS === 'web') return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundedAt.current = Date.now();
      } else if (nextState === 'active' && backgroundedAt.current) {
        const elapsed = Date.now() - backgroundedAt.current;
        backgroundedAt.current = null;
        if (elapsed >= LOCK_TIMEOUT_MS && authenticated) {
          setAuthenticated(false);
          setChecking(false);
        }
      }
    });

    return () => subscription.remove();
  }, [biometricEnabled, authenticated]);

  const authenticate = async () => {
    if (!biometricEnabled || Platform.OS === 'web') {
      setAuthenticated(true);
      setChecking(false);
      return;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock WhereDidItGo',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });
      setAuthenticated(result.success);
    } catch {
      setAuthenticated(false);
    }
    setChecking(false);
  };

  if (checking) {
    return (
      <View style={[lockStyles.container, { backgroundColor: colors.background }]}>
        <MaterialIcons name="lock" size={48} color={colors.primary} />
      </View>
    );
  }

  if (!authenticated) {
    return (
      <View style={[lockStyles.container, { backgroundColor: colors.background }]}>
        <View style={[lockStyles.iconWrap, { backgroundColor: `${colors.primary}15` }]}>
          <MaterialIcons name="fingerprint" size={64} color={colors.primary} />
        </View>
        <Text style={[lockStyles.title, { color: colors.textPrimary }]}>WhereDidItGo</Text>
        <Text style={[lockStyles.subtitle, { color: colors.textSecondary }]}>
          Authentication required
        </Text>
        <LinearGradient colors={[colors.primary, '#9B59B6']} style={lockStyles.unlockBtn}>
          <Text style={lockStyles.unlockText} onPress={authenticate}>
            Tap to Unlock
          </Text>
        </LinearGradient>
      </View>
    );
  }

  return <>{children}</>;
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const onboardingCompleted = useExpenseStore((s) => s.onboardingCompleted);

  if (!onboardingCompleted) {
    return <OnboardingScreen />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { isDark } = useTheme();
  const processAutoContributions = useExpenseStore((s) => s.processAutoContributions);
  const processRecurringExpenses = useExpenseStore((s) => s.processRecurringExpenses);
  const processRollovers = useExpenseStore((s) => s.processRollovers);
  const pushNotificationsEnabled = useExpenseStore((s) => s.pushNotificationsEnabled);
  const autoBackupReminder = useExpenseStore((s) => s.autoBackupReminder);
  const lastBackupDate = useExpenseStore((s) => s.lastBackupDate);
  const fixedExpenses = useExpenseStore((s) => s.fixedExpenses);
  const fixedIncomes = useExpenseStore((s) => s.fixedIncomes);
  const currencySymbol = useExpenseStore((s) => s.currencySymbol);
  const autoBackupEnabled = useExpenseStore((s) => s.autoBackupEnabled);
  const autoBackupFrequency = useExpenseStore((s) => s.autoBackupFrequency);
  const autoBackupMaxCount = useExpenseStore((s) => s.autoBackupMaxCount);
  const reminderLeadDays = useExpenseStore((s) => s.reminderLeadDays);

  useEffect(() => {
    processAutoContributions();
    processRecurringExpenses();
    processRollovers();
    if (pushNotificationsEnabled) {
      scheduleBillReminders(fixedExpenses, currencySymbol);
      scheduleMonthlyRecap();
      scheduleDueDateReminders(fixedExpenses, fixedIncomes, reminderLeadDays, currencySymbol);
      if (autoBackupReminder) {
        scheduleBackupReminder(lastBackupDate);
      }
    }
    // Auto-backup on launch if needed
    if (shouldAutoBackup(autoBackupEnabled, autoBackupFrequency, lastBackupDate, 0)) {
      const store = useExpenseStore.getState();
      performAutoBackup(store.getBackupState).then((ok) => {
        if (ok) rotateBackups(autoBackupMaxCount);
      });
    }
    // Sync widget data for home screen widgets (native builds)
    const store = useExpenseStore.getState();
    const widgetData = buildWidgetData(store);
    syncWidgetData(widgetData);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <BiometricGate>
        <OnboardingGate>
          <AppNavigator />
        </OnboardingGate>
      </BiometricGate>
      <KeyboardOverlay />
      <UndoSnackbar />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary fallbackTitle="App crashed unexpectedly">
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const lockStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
  },
  unlockBtn: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 999,
  },
  unlockText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
