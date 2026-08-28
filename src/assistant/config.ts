import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const API_KEY_STORAGE = 'ai-api-key';
const MODEL = 'gemini-3.6-flash';
const TEMPERATURE = 0.7;
const MAX_TOKENS = 1024;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

export const ASSISTANT_CONFIG = {
  model: MODEL,
  temperature: TEMPERATURE,
  maxTokens: MAX_TOKENS,
  apiUrl: API_URL,
} as const;

// SecureStore is not available on web — fall back to AsyncStorage
const isSecureStoreAvailable = Platform.OS !== 'web';

export async function getApiKey(): Promise<string | null> {
  if (isSecureStoreAvailable) {
    // Migrate from AsyncStorage if key exists there
    const legacyKey = await AsyncStorage.getItem(API_KEY_STORAGE);
    if (legacyKey) {
      await SecureStore.setItemAsync(API_KEY_STORAGE, legacyKey);
      await AsyncStorage.removeItem(API_KEY_STORAGE);
      return legacyKey;
    }
    return SecureStore.getItemAsync(API_KEY_STORAGE);
  }
  return AsyncStorage.getItem(API_KEY_STORAGE);
}

export async function setApiKey(key: string): Promise<void> {
  if (isSecureStoreAvailable) {
    await SecureStore.setItemAsync(API_KEY_STORAGE, key);
  } else {
    await AsyncStorage.setItem(API_KEY_STORAGE, key);
  }
}

export async function removeApiKey(): Promise<void> {
  if (isSecureStoreAvailable) {
    await SecureStore.deleteItemAsync(API_KEY_STORAGE);
  } else {
    await AsyncStorage.removeItem(API_KEY_STORAGE);
  }
  // Also clean up any legacy AsyncStorage entry
  await AsyncStorage.removeItem(API_KEY_STORAGE).catch(() => {});
}

export async function hasApiKey(): Promise<boolean> {
  const key = await getApiKey();
  return !!key && key.length > 0;
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '••••' + key.slice(-4);
}
