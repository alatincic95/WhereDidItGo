import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { useExpenseStore } from './src/store/useExpenseStore';
import { OnboardingScreen } from './src/screens/OnboardingScreen';

function BiometricGate({ children }: { children: React.ReactNode }) {
  const biometricEnabled = useExpenseStore((s) => s.biometricEnabled);
  const { colors, isDark } = useTheme();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    authenticate();
  }, []);

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

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <BiometricGate>
        <OnboardingGate>
          <AppNavigator />
        </OnboardingGate>
      </BiometricGate>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
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
