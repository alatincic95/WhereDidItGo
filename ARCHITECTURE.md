# WhereDidItGo — Codebase Architecture Reference

> Quick-reference for development. Avoids re-exploring the full codebase each session.
> **Last updated:** 2026-04-10

---

## Directory Structure

```
src/
├── components/
│   ├── AnimatedNumber.tsx        # Animated numeric display
│   ├── CategoryIcon.tsx          # Dynamic icon resolver (custom + default categories)
│   └── GlassCard.tsx             # Reusable glass-morphism card (theme-aware)
├── constants/
│   └── theme.ts                  # DARK_COLORS, LIGHT_COLORS, COLORS (dark fallback),
│                                 # SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS
├── contexts/
│   └── ThemeContext.tsx           # ThemeProvider + useTheme() hook
├── navigation/
│   └── AppNavigator.tsx          # Bottom tabs + native stack navigator
├── screens/
│   ├── DashboardScreen.tsx       # Main dashboard, FAB, settings modals (~1700 lines)
│   ├── ExpenseListScreen.tsx     # Filterable expense list
│   ├── AddExpenseScreen.tsx      # Modal: add/edit expense
│   ├── AddIncomeScreen.tsx       # Modal: add/edit income
│   ├── FixedExpensesScreen.tsx   # Recurring expenses management
│   ├── ProjectsScreen.tsx        # Budget list (UI says "Budgets")
│   ├── ProjectDetailScreen.tsx   # Budget detail view
│   ├── NotificationsScreen.tsx   # Smart alerts
│   ├── TrendsScreen.tsx          # Charts & monthly history
│   ├── SavingsGoalsScreen.tsx    # Savings goals
│   ├── CategoryBudgetsScreen.tsx  # Per-category monthly spending limits
│   ├── SettingsScreen.tsx        # Theme toggle, biometric lock, category budgets, data transfer
│   ├── DataTransferScreen.tsx    # Cloud backup, file transfer, transfer codes
│   └── OnboardingScreen.tsx      # First-launch walkthrough (5 steps)
├── store/
│   ├── useExpenseStore.ts        # Main Zustand store (~670 lines, persisted)
│   └── useNotificationStore.ts   # Notification store (~170 lines)
├── types/
│   └── index.ts                  # All TypeScript interfaces, enums, constants
│                                 # (Expense, Budget, Income, categories, colors, etc.)
└── utils/
    ├── currency.ts               # CURRENCY_OPTIONS (14), formatCurrency, getCurrencySymbol
    ├── exportData.ts             # CSV export, JSON backup/restore, BackupData interface
    └── cloudBackup.ts            # Cloud share, transfer code generation/parsing

Root files:
├── App.tsx                       # Entry: ThemeProvider → BiometricGate → OnboardingGate → AppNavigator
├── index.ts                      # Expo registerRootComponent
├── app.json                      # Expo config (SDK 54, dark UI style)
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── metro.config.js               # Metro bundler config
```

---

## Zustand Store Shape (`useExpenseStore`)

### State Fields
| Field | Type | Persisted | Notes |
|-------|------|-----------|-------|
| `expenses` | `Expense[]` | Yes | Main expense list |
| `fixedExpenses` | `FixedExpense[]` | Yes | Monthly recurring |
| `incomes` | `Income[]` | Yes | One-time income |
| `fixedIncomes` | `FixedIncome[]` | Yes | Recurring income |
| `budgets` | `Budget[]` | Yes | Formerly "projects" |
| `customCategories` | `CustomCategory[]` | Yes | User-created categories |
| `exchangeRates` | `ExchangeRate[]` | Yes | Multi-currency support |
| `savingsGoals` | `SavingsGoal[]` | Yes | Savings targets |
| `budgetTemplates` | `BudgetTemplate[]` | Yes | Reusable budget configs |
| `categoryBudgets` | `CategoryBudget[]` | Yes | Per-category monthly limits |
| `initialBalance` | `number` | Yes | Starting balance |
| `monthlyIncome` | `number` | Yes | Base monthly income |
| `currencySymbol` | `string` | Yes | e.g. "$", "€" |
| `themeMode` | `ThemeMode` | Yes | `'dark'` or `'light'` |
| `biometricEnabled` | `boolean` | Yes | Face ID / fingerprint lock |
| `onboardingCompleted` | `boolean` | Yes | First-launch gate |

### Key Actions (grouped)
- **Expenses:** add, update, delete, markCompleted
- **Fixed Expenses:** add, update, delete
- **Income:** add, update, delete
- **Fixed Income:** add, update, delete, getTotal
- **Budgets:** add, update, delete, getExpenses, getTotal, getPendingTotal
- **Custom Categories:** add, delete
- **Exchange Rates:** add, update, delete, convertToBase
- **Savings Goals:** add, update, delete, addFunds
- **Budget Templates:** add, delete, createFromTemplate
- **Category Budgets:** set, remove, toggle, getStatus
- **Settings:** setInitialBalance, setMonthlyIncome, setCurrencySymbol, setThemeMode, setBiometricEnabled, setOnboardingCompleted
- **Computed:** getMonthlyExpenses, getMonthlyTotal, getMonthlyBalance, getOverallBalance, getCategoryTotals, etc.
- **Backup:** getBackupState, restoreFromBackup

### Persistence
- Storage: AsyncStorage via `zustand/middleware/persist`
- Store key: `'expense-store'`
- Version: 1
- Migration: renames `projects` → `budgets`

---

## Navigation Map

```
Stack.Navigator (headerShown: false)
├── Main (TabNavigator)
│   ├── Dashboard → DashboardScreen
│   ├── Expenses → ExpenseListScreen
│   ├── Budgets  → ProjectsScreen
│   └── Fixed    → FixedExpensesScreen (label: "Recurring")
├── AddExpense     (modal, slide_from_bottom)
├── AddIncome      (modal, slide_from_bottom)
├── BudgetDetail   (slide_from_right)
├── Notifications  (slide_from_right)
├── Trends         (slide_from_right)
├── SavingsGoals   (slide_from_right)
├── Settings       (slide_from_right)
├── DataTransfer   (slide_from_right)
└── CategoryBudgets (slide_from_right)
```

---

## Theme System

- **Palettes:** `DARK_COLORS` / `LIGHT_COLORS` in `src/constants/theme.ts`
- **Provider:** `ThemeProvider` in `src/contexts/ThemeContext.tsx` reads `themeMode` from store
- **Hook:** `useTheme()` → `{ colors, isDark, mode, toggle }`
- **Pattern:** Screens import static `COLORS` for `StyleSheet.create` (dark fallback). Dynamic theming via inline `{ backgroundColor: colors.background }` on container View.
- **Components:** `GlassCard` adapts glow/border per theme. Tab bar adapts background.

---

## App Entry Flow (App.tsx)

```
ThemeProvider
  └── AppContent
        ├── StatusBar (light/dark based on theme)
        └── BiometricGate (if biometricEnabled → authenticate)
              └── OnboardingGate (if !onboardingCompleted → OnboardingScreen)
                    └── AppNavigator
```

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| expo | ~54.0.33 | Framework |
| react-native | 0.81.5 | UI runtime |
| react | 19.1.0 | Core |
| zustand | ^5.0.12 | State management |
| @react-navigation/* | ^7.x | Navigation |
| expo-linear-gradient | ~15.0.8 | Gradient backgrounds |
| @expo/vector-icons | ^15.1.1 | MaterialIcons |
| expo-local-authentication | latest | Biometric lock |
| expo-file-system | ~19.0.21 | File I/O |
| expo-sharing | ~14.0.8 | Native share sheet |
| expo-document-picker | ~14.0.8 | File picker |
| expo-image-picker | ~17.0.10 | Receipt photos |
| formik + yup | ^2.4.9 / ^1.7.1 | Form validation |

---

## Data Types Quick Reference

```typescript
Expense:       { id, amount, category, description, date, isFixed, projectId?, isPending?, currency?, receiptUri? }
FixedExpense:  { id, amount, category, description, frequency? }
Income:        { id, amount, source: IncomeSource, description, date }
FixedIncome:   { id, amount, source, description, frequency? }
Budget:        { id, name, description, budget?, color, status, createdAt }
CustomCategory:{ name, icon, color }
SavingsGoal:   { id, name, targetAmount, currentAmount, deadline?, color, icon, createdAt }
BudgetTemplate:{ id, name, description, budget?, color, icon, createdAt }
CategoryBudget:{ category, monthlyLimit, enabled }
ExchangeRate:  { from, rate }
```

**Categories:** Food, Transport, Housing, Entertainment, Shopping, Health, Education, Bills, Subscriptions, Other
**Income Sources:** Gift, Bonus, Freelance, Sale, Refund, Investment, Other
**Frequencies:** weekly, biweekly, monthly, quarterly, yearly (RecurringFrequency type)
**Monthly multipliers:** weekly=52/12, biweekly=26/12, monthly=1, quarterly=1/3, yearly=1/12

---

## Conventions & Patterns

- **Styling:** `StyleSheet.create` with theme constants; inline overrides for dynamic colors
- **Modals:** Custom `<Modal>` components (never `Alert.alert` — doesn't work on web)
- **IDs:** `uuidv4()` custom implementation in store (web uses `crypto.randomUUID()`)
- **Confirmation:** All destructive actions use confirmation modals
- **Icons:** MaterialIcons from `@expo/vector-icons`
- **Cards:** `GlassCard` component for consistent glass-morphism styling
- **FAB:** Floating action button pattern on Dashboard and Expenses screens

---

## Dev Commands

```bash
npx expo start              # Metro dev server (port 8081)
npx expo start --web        # With web support
npx tsc --noEmit            # Type-check
lsof -ti:8081 | xargs kill -9  # Kill Metro
```
