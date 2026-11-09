import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API keys live in the phone's secure keychain (iOS Keychain / Android Keystore), never in the
// regular app data or in backups. The web preview has no keychain, so it falls back to browser storage.

const CLAUDE_KEY = 'pawgress.claudeApiKey';
const native = Platform.OS === 'ios' || Platform.OS === 'android';

export async function getClaudeKey(): Promise<string | null> {
  try {
    return native ? await SecureStore.getItemAsync(CLAUDE_KEY) : await AsyncStorage.getItem(CLAUDE_KEY);
  } catch {
    return null;
  }
}

export async function setClaudeKey(value: string): Promise<void> {
  if (native) await SecureStore.setItemAsync(CLAUDE_KEY, value);
  else await AsyncStorage.setItem(CLAUDE_KEY, value);
}

export async function deleteClaudeKey(): Promise<void> {
  try {
    if (native) await SecureStore.deleteItemAsync(CLAUDE_KEY);
    else await AsyncStorage.removeItem(CLAUDE_KEY);
  } catch {
    // Nothing stored.
  }
}

/** Shows enough of a key to recognize it without revealing it. */
export function maskKey(key: string) {
  return key.length > 12 ? `${key.slice(0, 7)}…${key.slice(-4)}` : '••••';
}
