# Firebase Setup Instructions

To activate Firebase Auth in the app, complete these steps:

## 1. Create Firebase Project
- Go to [Firebase Console](https://console.firebase.google.com)
- Create a new project (or use an existing one)
- Register your app with the bundle ID: `com.wherediditgo.app`

## 2. Enable Email/Password Auth
- In Firebase Console, go to **Authentication** > **Sign-in method**
- Enable **Email/Password** provider

## 3. Download Config Files
- **Android**: Download `google-services.json` and place it in the project root (Expo will handle placement during prebuild)
- **iOS**: Download `GoogleService-Info.plist` and place it in the project root

## 4. Build with Native Modules
```bash
npx expo prebuild --clean
```
This generates the native `ios/` and `android/` directories with Firebase configured.

## 5. Run on Device
After prebuild, use native builds instead of Expo Go:
```bash
npx expo run:ios
# or
npx expo run:android
```

## Notes
- Firebase Auth is optional — the app works fully offline without it
- Auth state is persisted locally via Zustand store
- The `onAuthStateChanged` listener in App.tsx has a try/catch so the app doesn't crash if Firebase isn't configured yet
- Firebase plugins are already added to `app.json`
- Packages already installed: `@react-native-firebase/app`, `@react-native-firebase/auth`
