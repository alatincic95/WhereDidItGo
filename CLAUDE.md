# WhereDidItGo – Mobile Expense Tracking App

## Overview

WhereDidItGo is a mobile application for iOS and Android that allows users to track their expenses, income, monitor their financial balance, and manage recurring payments. The goal is to provide a simple and clear overview of both monthly and overall financial status.

---

## Technology Stack

- React Native + TypeScript
- Expo (SDK 54)
- React Navigation (bottom tabs + native stack)
- Zustand for state management (with persist middleware)
- AsyncStorage for data persistence
- expo-linear-gradient, @expo/vector-icons for UI
- expo-local-authentication for biometric lock

No backend — all data is stored locally on device.

---

## Core Features (Implemented)

### Balance Tracking

- Overall balance (accumulated across all time)
- Monthly balance (resets each month)
- Formula: Balance = Base Monthly Income + Extra Income - Expenses - Fixed Expenses

### Expense Management

- Add, edit, delete expenses (with confirmation modal)
- Default categories: Food, Transport, Housing, Entertainment, Shopping, Health, Education, Bills, Subscriptions, Other
- Custom categories with user-chosen name, icon, and color
- Optional budget linking
- Pending expense support (deduct now vs deduct when completed)
- Tap expense card to edit, delete button inside edit screen
- FAB on Expenses tab to add new expense

### Expense Photos / Receipts

- Attach receipt photo via camera or gallery picker (expo-image-picker)
- Receipt preview displayed inline on the add/edit expense screen
- Replace or remove attached receipts
- Full-screen receipt viewer on tap
- Stored as local URI in `receiptUri` field on the Expense

### Income Tracking

- One-time income entries (gifts, bonuses, freelance, sales, refunds, investments)
- Added to both monthly and overall balance automatically
- Sources: Gift, Bonus, Freelance, Sale, Refund, Investment, Other

### Fixed/Recurring Expenses

- Recurring charges with configurable frequency: weekly, bi-weekly, monthly, quarterly, yearly
- Frequency selector in add/edit modal (5 options)
- Amounts auto-converted to monthly equivalents for balance calculations (e.g., yearly rent / 12)
- Frequency badge shown on each recurring item (replaces hardcoded "Monthly")
- Per-period label on amounts (e.g., "$1,200/month", "$50/week")
- Backward compatible: existing items without frequency default to monthly
- Managed via dedicated Recurring tab with expenses/income toggle
- Delete confirmation modal

### Expense Filtering

- Search by description/category
- Filter by category (multi-select, includes custom categories)
- Filter by amount range (min/max)
- Sort by date, highest amount, lowest amount
- "All" month option to view expenses across all months

### Budget Tracking (formerly "Projects")

- Create budgets with optional spending limit and color
- Link expenses to budgets
- Pending expenses: choose "Deduct now" or "Deduct when completed"
- Pending expenses shown with dashed border, can be marked complete via checkmark button
- Budget progress bar shows committed (solid) + pending (translucent) amounts
- Hero card displays committed total and pending total separately
- Active/completed status
- Delete confirmation modal

### Custom Categories

- Create custom expense categories with name, icon (24 Material Icons options), and color (12 options)
- Persisted in store, available across all screens (add expense, recurring, filters, dashboard)
- CategoryIcon component auto-resolves custom category icon/color

### Monthly History / Trends

- Bar chart visualization of spending and income over time (last 6 months)
- Toggle between Expenses, Income, or Both views
- Month-over-month spending comparison with percentage change
- Category breakdown for current month
- Monthly summary table
- Custom bar charts built with React Native Views (no chart library dependency)
- Accessible from Dashboard via quick-action card

### Savings Goals

- Set target amount and optional deadline
- Track progress with auto-calculated monthly amount needed
- Add funds to goals incrementally
- 20 icon options, 12 color options
- Summary card showing total saved vs total target
- Progress bar with percentage
- Tap to edit, long-press to delete (with confirmation modal)
- Accessible from Dashboard via quick-action card

### Budget Templates

- Save budget configurations as reusable templates
- "Save & Create as Template" button in budget creation modal
- Templates list accessible via bookmark icon in Budgets header
- One-tap budget creation from template
- Long-press template to delete (with confirmation modal)

### Category Budgets

- Set monthly spending limits per category (e.g., "$400/month on Food")
- Managed via dedicated CategoryBudgets screen (Settings → Category Budgets)
- Per-category progress bars color-coded: default color → warning (yellow) at 80% → danger (red) at 100%
- Enable/disable individual limits via toggle (without deleting the configured amount)
- Summary card showing total allocated budget vs monthly income with allocation bar
- Dashboard integration: category breakdown bars fill relative to budget limit, "OVER" badge when exceeded, "of $X" limit text
- Stored as `CategoryBudget[]` in Zustand store (`category`, `monthlyLimit`, `enabled`)
- `getCategoryBudgetStatus(month)` computes spent vs limit including one-time + recurring expenses with currency conversion
- Smart notifications at 80% and 100% thresholds per category
- Screen: `src/screens/CategoryBudgetsScreen.tsx`

### Smart Notifications

- Budget warnings (75%, 90%, exceeded)
- Budget item alerts (80%, 100%)
- Category budget alerts (80%, exceeded)
- Bill reminders
- All confirmation dialogs use custom Modal (not Alert.alert)

### Multi-Currency Support

- Configurable base currency (14 options)
- Exchange rates for foreign currency expenses
- Expenses can be tagged with a specific currency
- Auto-conversion to base currency in all calculations

### Dark Mode / Theme Toggle

- Full light and dark theme support with consistent color palettes
- ThemeContext provider (`src/contexts/ThemeContext.tsx`) wraps the entire app
- `useTheme()` hook provides `colors`, `isDark`, `mode`, and `toggle()`
- Theme preference persisted in Zustand store (survives app restarts)
- Toggle accessible from Settings screen and Onboarding
- All screens use dynamic `colors.background` for container backgrounds
- GlassCard component adapts glow and border styling per theme
- Tab bar adapts background color per theme
- StatusBar style auto-switches between light/dark
- Color palettes: `DARK_COLORS` and `LIGHT_COLORS` in `src/constants/theme.ts`

### Onboarding Flow

- First-launch walkthrough shown before main app (gated by `onboardingCompleted` flag)
- 5 steps: Welcome, Currency selection, Income input, Category selection, Confirmation
- Animated transitions between steps with progress dots
- Theme toggle available on welcome step
- Currency picker with all 14 supported currencies
- Income input with currency prefix
- Category grid with toggleable chips (pre-selects Food, Transport, Housing, Entertainment)
- Settings saved to Zustand store on completion
- Screen: `src/screens/OnboardingScreen.tsx`

### Biometric Lock

- Face ID / Fingerprint authentication to protect financial data
- Uses `expo-local-authentication` for cross-platform biometric support
- Toggle in Settings screen to enable/disable
- Requires successful biometric authentication to enable (confirmation prompt)
- On app launch, authentication gate blocks access until verified
- Fallback to device passcode supported
- Gracefully handles: no hardware, not enrolled, web platform
- Lock screen with "Tap to Unlock" button if authentication fails
- Biometric type auto-detected (Face ID vs Fingerprint) and shown in UI

### Cloud Backup & Restore

- Share backup to any cloud service via native share sheet (iCloud Drive, Google Drive, Dropbox, etc.)
- JSON backup format with metadata (app name, version, export date)
- Restore from any JSON backup file via file picker
- Restore confirmation modal showing backup stats (expenses count, budgets, goals, date)
- Accessible from Settings → Backup & Transfer → DataTransfer screen
- Utility: `src/utils/cloudBackup.ts`

### Data Migration Between Devices

- Generate transfer code: base64-encoded JSON of all app data
- Copy/share transfer code to send to another device
- Import transfer code on destination device to restore all data
- File-based transfer: export JSON backup and import on other device
- Dedicated DataTransfer screen (`src/screens/DataTransferScreen.tsx`)
- Accessible from Settings → Backup & Transfer

### Data Persistence

- Zustand persist middleware + AsyncStorage
- Migration support (projects → budgets key rename)
- Persisted state includes: expenses, fixedExpenses, incomes, fixedIncomes, budgets, customCategories, categoryBudgets, exchangeRates, savingsGoals, budgetTemplates, themeMode, biometricEnabled, onboardingCompleted, settings
- Survives app restarts, force closes, device reboots

---

## Data Model

### Expense

- id, amount, category, description, date, isFixed, projectId?, isPending?, currency?, receiptUri?

### FixedExpense

- id, amount, category, description, frequency? (RecurringFrequency, defaults to 'monthly')

### Income

- id, amount, source (IncomeSource), description, date

### FixedIncome

- id, amount, source, description, frequency? (RecurringFrequency, defaults to 'monthly')

### Budget (formerly Project)

- id, name, description, budget?, color, status (BudgetStatus), createdAt

### CustomCategory

- name, icon, color

### SavingsGoal

- id, name, targetAmount, currentAmount, deadline?, color, icon, createdAt

### BudgetTemplate

- id, name, description, budget?, color, icon, createdAt

### CategoryBudget

- category (string, matches ExpenseCategory or CustomCategory.name), monthlyLimit, enabled

### ExchangeRate

- from (currency code), rate (to base currency)

---

## Screens

- **Dashboard** — balance cards, budget usage, category breakdown, recent transactions, quick-action cards (Trends, Goals), FAB (income/expense), settings gear button
- **Expenses** — filterable list with search, category/amount filters, sort, month selector with "All" option, FAB for adding expense
- **Budgets** — budget list with spending progress, pending totals, detail view, template management (bookmark icon)
- **BudgetDetail** — hero card (committed + pending), stats, category breakdown, pending/committed expense lists, mark-complete button
- **Recurring** — fixed expense management
- **Trends** — monthly bar charts (expenses/income/both), month-over-month change, category breakdown, summary table
- **SavingsGoals** — savings goals list with progress bars, add funds, deadline tracking
- **AddExpense** — modal for add/edit expense (with delete confirmation, budget selector, pending toggle, custom category creation)
- **AddIncome** — modal for add/edit income (with delete confirmation)
- **Notifications** — smart alerts with delete/clear confirmation modals
- **CategoryBudgets** — per-category monthly spending limits with progress bars, enable/disable toggles, edit/remove modals
- **Settings** — theme toggle (dark/light mode), biometric lock toggle, category budgets link, data transfer link, app info
- **DataTransfer** — cloud backup, file backup/restore, transfer code generation/import
- **Onboarding** — first-launch walkthrough (currency, income, categories)

---

## Navigation

- Bottom tabs: Dashboard, Expenses, Budgets, Recurring
- Stack screens: AddExpense (modal), AddIncome (modal), BudgetDetail (slide), Notifications (slide), Trends (slide), SavingsGoals (slide), Settings (slide), DataTransfer (slide), CategoryBudgets (slide)
- Gates: BiometricGate (blocks app until authenticated if enabled), OnboardingGate (shows onboarding if not completed)

---

## Architecture

### Theme System

- `src/constants/theme.ts` — exports `DARK_COLORS`, `LIGHT_COLORS`, `COLORS` (dark fallback), spacing/font/radius/shadow constants
- `src/contexts/ThemeContext.tsx` — `ThemeProvider` wraps app, reads `themeMode` from Zustand, provides `useTheme()` hook
- Screens import static `COLORS` for StyleSheet.create (dark fallback) and use `useTheme().colors` for dynamic container backgrounds
- GlassCard adapts glow/border per theme

### App Entry (App.tsx)

- `ThemeProvider` → `AppContent` → `StatusBar` + `BiometricGate` → `OnboardingGate` → `AppNavigator`
- BiometricGate: checks `biometricEnabled` flag, prompts authentication on launch
- OnboardingGate: checks `onboardingCompleted` flag, shows OnboardingScreen if false

---

## Development

- `npx expo start` — start Metro dev server (port 8081)
- `npx expo start --web` — start with web support
- `npx tsc --noEmit` — type-check without emitting
- `lsof -ti:8081 | xargs kill -9` — kill Metro before restart

## Gotchas

- Do not apply `borderWidth`, `backgroundColor`, or `borderRadius` directly on `<Text>` in React Native — wrap in a `<View>` to avoid visual artifacts
- State management uses Zustand (not Redux) — stores are in `src/store/`
- `Alert.alert` with buttons does NOT work on web — always use custom Modal for confirmations
- When sorting expenses by amount, render a flat list (not grouped by date) to preserve sort order
- `SHADOWS.glow` renders as visible rectangle on web — avoid on circular/rounded elements, use plain `borderRadius` instead
- Expense `projectId` field name kept for backward compatibility with persisted data (maps to budgets)
- Biometric lock and native share sheet do not work on web — gracefully degraded
- Theme: StyleSheet.create uses static dark palette (`COLORS`); dynamic theming applies via inline style overrides using `useTheme().colors`
- Home screen widgets require `expo prebuild` (native build) — not available in Expo Go / managed workflow
