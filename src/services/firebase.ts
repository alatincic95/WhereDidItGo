// Firebase auth helpers — lazy-loaded so the app doesn't crash in Expo Go
// where native Firebase modules aren't available.

let _available: boolean | null = null;

function checkAvailable(): boolean {
  if (_available !== null) return _available;
  try {
    const { TurboModuleRegistry } = require('react-native');
    const nativeModule = TurboModuleRegistry.get('NativeRNFBTurboApp');
    _available = nativeModule != null;
  } catch {
    _available = false;
  }
  return _available;
}

export function isFirebaseAvailable(): boolean {
  return checkAvailable();
}

export async function signUp(email: string, password: string) {
  if (!checkAvailable()) throw new Error('Firebase is not configured. See FIREBASE_SETUP.md');
  const { getAuth, createUserWithEmailAndPassword } = require('@react-native-firebase/auth');
  return createUserWithEmailAndPassword(getAuth(), email, password);
}

export async function signIn(email: string, password: string) {
  if (!checkAvailable()) throw new Error('Firebase is not configured. See FIREBASE_SETUP.md');
  const { getAuth, signInWithEmailAndPassword } = require('@react-native-firebase/auth');
  return signInWithEmailAndPassword(getAuth(), email, password);
}

export async function signOut(): Promise<void> {
  if (!checkAvailable()) return;
  const { getAuth, signOut: fbSignOut } = require('@react-native-firebase/auth');
  return fbSignOut(getAuth());
}

export function getCurrentUser() {
  if (!checkAvailable()) return null;
  const { getAuth } = require('@react-native-firebase/auth');
  return getAuth().currentUser;
}

export function onAuthStateChanged(
  callback: (user: { uid: string; email: string | null } | null) => void
): () => void {
  if (!checkAvailable()) return () => {};
  const { getAuth, onAuthStateChanged: fbOnAuth } = require('@react-native-firebase/auth');
  return fbOnAuth(getAuth(), callback);
}
