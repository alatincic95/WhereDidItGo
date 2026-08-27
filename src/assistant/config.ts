import AsyncStorage from '@react-native-async-storage/async-storage';

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

export async function getApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(API_KEY_STORAGE);
}

export async function setApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(API_KEY_STORAGE, key);
}

export async function removeApiKey(): Promise<void> {
  await AsyncStorage.removeItem(API_KEY_STORAGE);
}

export async function hasApiKey(): Promise<boolean> {
  const key = await AsyncStorage.getItem(API_KEY_STORAGE);
  return !!key && key.length > 0;
}
