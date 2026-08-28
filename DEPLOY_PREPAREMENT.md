# WhereDidItGo — Pre-Launch Deployment Preparation

## Context
The app is feature-rich (~40+ features implemented) but has gaps in production hardening, platform compliance, data safety, and UX polish that need addressing before an App Store / Play Store submission. This document prioritizes items by launch-blocking severity.

---

## TIER 1 — Release Blockers (Must fix)

### 1. App Store Configuration (`app.json`)
**Why:** App will be rejected without proper permissions, bundle IDs, and privacy policy.
- Add `bundleIdentifier` (iOS) and `package` (Android)
- Add plugin configs for `expo-image-picker` (camera + photo library permission strings), `expo-local-authentication` (Face ID usage description), `expo-notifications`
- Add iOS `infoPlist` with `NSFaceIDUsageDescription`, `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`
- Add `scheme` for deep linking
- **File:** `app.json`

### 2. Safe Area Handling on All Screens
**Why:** Content is obscured on notched iPhones (13+, 14+, 15+, 16+) and some Androids. Every screen uses hardcoded `paddingTop: 60`.
- Use `react-native-safe-area-context` (already installed) with `useSafeAreaInsets()`
- Replace all hardcoded `paddingTop: 60` with dynamic insets
- Wrap root App in `SafeAreaProvider`
- **Files:** App.tsx, DashboardScreen, ExpenseListScreen, IncomeListScreen, FixedExpensesScreen, SettingsScreen, SavingsGoalsScreen, TrendsScreen, BillCalendarScreen, NotificationsScreen, DataTransferScreen, CategoryBudgetsScreen, GlobalSearchScreen, AssistantScreen, OnboardingScreen, DashboardCustomizeScreen, ReorderCategoriesScreen, AddExpenseScreen, AddIncomeScreen, BudgetDetailScreen

### 3. API Key Security
**Why:** API keys stored in plaintext AsyncStorage can be read by any process with device access.
- Replace `AsyncStorage` with `expo-secure-store` for API key storage in `src/assistant/config.ts`
- Mask displayed key in Settings (show only last 4 chars)
- **Files:** `src/assistant/config.ts`, `src/screens/SettingsScreen.tsx`

### 4. Form Validation & User Feedback
**Why:** Multiple forms silently fail on invalid input — user has no idea why nothing happened.
- Add visible error feedback (shake animation or red text) when:
  - Amount is empty/NaN/zero (AddExpense, AddIncome, FixedExpenses, SavingsGoals, CategoryBudgets)
  - Required fields are missing (name in SavingsGoals, description in budgets)
- Add `maxLength` to description/name TextInputs (prevent layout breakage)
- **Files:** AddExpenseScreen, AddIncomeScreen, FixedExpensesScreen, SavingsGoalsScreen, CategoryBudgetsScreen

### 5. Monthly Date Overflow Bug in Recurring Processor
**Why:** `setMonth(month + 1)` on Jan 31 produces Mar 3 — generates entries on wrong dates.
- Clamp day to last day of target month after `setMonth()` / `setMonth(+3)`
- **File:** `src/utils/recurringProcessor.ts` (advanceByFrequency function)

### 6. Root Error Boundary
**Why:** Unhandled error in ThemeProvider, store init, or BiometricGate crashes the entire app with a white screen.
- Wrap `<ThemeProvider>` in a root ErrorBoundary in App.tsx
- **File:** `App.tsx`

---

## TIER 2 — High Priority (Should fix before launch)

### 7. Keyboard Avoidance on All Form Screens
**Why:** Keyboard covers input fields on many screens, especially on smaller devices.
- Add `KeyboardAvoidingView` with `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` to: FixedExpensesScreen modals, SavingsGoalsScreen modals, CategoryBudgetsScreen modals, DataTransferScreen import modal
- **Files:** FixedExpensesScreen, SavingsGoalsScreen, CategoryBudgetsScreen, DataTransferScreen

### 8. Settings: Add "Reset All Data" Option
**Why:** Users need a way to wipe everything and start fresh without reinstalling.
- Add "Reset All Data" row in Settings with double-confirmation modal
- Clears Zustand store + AsyncStorage
- Resets `onboardingCompleted` to false (triggers re-onboarding)
- **Files:** `src/screens/SettingsScreen.tsx`, `src/store/useExpenseStore.ts`

### 9. Settings: Edit Monthly Income
**Why:** Users can only change monthly income by tapping the hero card on Dashboard — not discoverable.
- Add "Monthly Income" editable row in Settings
- **File:** `src/screens/SettingsScreen.tsx`

### 10. Accessibility: Color Contrast Fix
**Why:** Dark mode `textMuted` (#6B6F8D on #0F0F1A) = ~3.2:1 contrast ratio, fails WCAG AA (4.5:1 minimum).
- Bump dark mode `textMuted` from `#6B6F8D` to `#8B8FAD` or brighter
- Verify all muted text combinations meet 4.5:1
- **File:** `src/constants/theme.ts`

### 11. Accessibility: Touch Targets
**Why:** Several interactive elements are 32x32 or smaller — below iOS 44x44 minimum.
- Audit and increase: DashboardCustomizeScreen reorder icons, BillCalendarScreen day cells, NotificationsScreen action icons
- Wrap small icons in larger `TouchableOpacity` hitSlop areas
- **Files:** DashboardCustomizeScreen, BillCalendarScreen, NotificationsScreen

### 12. Import Data Validation
**Why:** Malformed JSON import could corrupt app state or crash.
- Validate required fields exist and have correct types before restoring
- Show clear error message if validation fails
- **Files:** `src/utils/cloudBackup.ts`, `src/screens/DataTransferScreen.tsx`

### 13. Biometric Re-lock on Background
**Why:** Once unlocked, the app stays unlocked forever — even after hours in background.
- Add AppState listener: when app returns from background (>5 min), require re-authentication
- **File:** `App.tsx` (BiometricGate)

### 14. CSV Export: Newline Escaping
**Why:** Descriptions with newlines break CSV formatting.
- Wrap fields containing newlines in quotes (same as comma handling)
- **File:** `src/utils/exportData.ts`

---

## TIER 3 — Medium Priority (First update)

### 15. Crash Reporting Integration
- Add Sentry or similar (`expo-sentry` plugin)
- Wire into ErrorBoundary to report caught errors

### 16. Onboarding: Skip & Re-run
- Add "Skip" button on onboarding steps
- Add "Re-run Setup Wizard" option in Settings

### 17. Accessibility Labels on All Buttons
- Add `accessibilityLabel` + `accessibilityRole` to all icon-only buttons across all screens (only ~15 attributes exist app-wide currently)

### 18. Network Status Awareness
- Show offline banner when no connectivity (for currency sync, AI assistant, OCR)
- Disable network-dependent buttons when offline

### 19. Performance: Memoize Heavy Computations
- Add `useMemo` to filtered/grouped expense lists in ExpenseListScreen and IncomeListScreen
- Wrap `renderItem` functions in `useCallback`

### 20. i18n: Wire Up Translation Keys
- The `t()` function and English strings exist in `src/i18n/index.ts` but are unused across screens
- Gradually replace hardcoded strings with `t()` calls (not blocking for English-only launch, but needed for any future locale)

---

## TIER 4 — Nice to Have (Post-launch)

- Month start date configuration (for mid-month pay cycles)
- Backup encryption (encrypt JSON before sharing)
- Font scaling support (respect system accessibility text size)
- Deep linking to specific screens
- Analytics/event tracking
- Retry with exponential backoff for Gemini API rate limits
- Privacy Policy page (in-app webview or link)

---

## Verification Checklist

1. **Type check:** `npx tsc --noEmit`
2. **Tests:** `npx jest` (all existing tests should still pass)
3. **Manual testing per tier:**
   - Tier 1: Test on notched iPhone simulator, try invalid form inputs, verify API key stored securely, create monthly recurring on 31st and verify correct dates, trigger root error
   - Tier 2: Test keyboard on all form modals, reset data flow, edit income from settings, check contrast with accessibility inspector
   - Tier 3: Verify crash reports, test onboarding skip/re-run, run VoiceOver
4. **Build verification:** `npx expo prebuild` + `npx expo run:ios` to verify app.json plugins work
