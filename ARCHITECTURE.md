# WhereDidItGo — Codebase Architecture Reference

> Quick-reference for development. Avoids re-exploring the full codebase each session.
> **Last updated:** 2026-08-27

---

## Directory Structure

```
src/
├── assistant/
│   ├── config.ts                 # API key storage, model config (Gemini)
│   ├── groqClient.ts             # AI chat client
│   ├── systemPrompt.ts           # Assistant system prompt with financial context
│   ├── toolExecutor.ts           # Executes assistant tool calls against store
│   ├── tools.ts                  # Tool definitions for assistant
│   └── types.ts                  # Assistant-specific types
├── components/
│   ├── AnimatedNumber.tsx        # Animated numeric display
│   ├── CategoryIcon.tsx          # Dynamic icon resolver (custom + default categories)
│   ├── ErrorBoundary.tsx         # Per-screen error boundary with retry (class component)
│   ├── GlassCard.tsx             # Reusable glass-morphism card (theme-aware)
│   ├── UndoSnackbar.tsx          # Bottom snackbar for undo-after-delete
│   ├── assistant/
│   │   ├── ChatInputBar.tsx      # Chat text input with send button
│   │   ├── ChatMessageBubble.tsx # Message bubble (user/assistant)
│   │   └── SuggestedPrompts.tsx  # Quick prompt suggestions
│   ├── budget/
│   │   ├── BudgetCard.tsx        # Budget list item card
│   │   ├── BudgetFormModal.tsx   # Create/edit budget modal
│   │   ├── BudgetSummaryCard.tsx # Budget overview summary
│   │   ├── BudgetTemplatesModal.tsx # Template browser modal
│   │   ├── DeleteConfirmModal.tsx # Reusable delete confirmation
│   │   └── index.ts
│   ├── dashboard/
│   │   ├── BudgetUsageCard.tsx   # Budget usage progress bars
│   │   ├── DashboardFAB.tsx      # Expandable FAB (expense/income)
│   │   ├── DashboardModals.tsx   # Income edit, currency picker modals
│   │   ├── helpers.ts            # Dashboard utility functions
│   │   ├── HeroBalanceCard.tsx   # Main balance card with gradient
│   │   ├── QuickActionsRow.tsx   # Trends, Goals, Income quick-action cards
│   │   ├── QuickAddBar.tsx       # Natural language expense input
│   │   ├── RecentTransactions.tsx # Recent expense/income list
│   │   ├── SummaryCards.tsx      # Monthly expense/income summary
│   │   ├── TopCategoriesCard.tsx # Category breakdown with bars
│   │   ├── ViewModeToggle.tsx    # Monthly/Overall toggle
│   │   └── index.ts
│   └── expense/
│       ├── AmountInput.tsx       # Numeric amount input with currency
│       ├── BudgetSelector.tsx    # Budget linking dropdown
│       ├── CategoryGrid.tsx      # Category selection grid
│       ├── CurrencySelector.tsx  # Foreign currency picker
│       ├── DatePickerSection.tsx # Date picker
│       ├── ExpenseModals.tsx     # Delete confirm, convert-to-recurring modals
│       ├── ReceiptSection.tsx    # Receipt photo picker, preview, OCR scan
│       ├── SplitTransactions.tsx # Split expense across categories
│       ├── TagsInput.tsx         # Tag/label input with autocomplete
│       └── index.ts
├── constants/
│   └── theme.ts                  # DARK_COLORS, LIGHT_COLORS, COLORS (dark fallback),
│                                 # SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS
├── contexts/
│   └── ThemeContext.tsx           # ThemeProvider + useTheme() hook
├── navigation/
│   └── AppNavigator.tsx          # Bottom tabs (5) + native stack navigator
├── screens/
│   ├── DashboardScreen.tsx       # Main dashboard, FAB, settings modals
│   ├── ExpenseListScreen.tsx     # Filterable expense list
│   ├── IncomeListScreen.tsx      # Filterable income list (green accent)
│   ├── AddExpenseScreen.tsx      # Modal: add/edit expense
│   ├── AddIncomeScreen.tsx       # Modal: add/edit income (with convert-to-recurring)
│   ├── FixedExpensesScreen.tsx   # Recurring expenses management
│   ├── ProjectsScreen.tsx        # Budget list (UI says "Budgets")
│   ├── ProjectDetailScreen.tsx   # Budget detail view
│   ├── NotificationsScreen.tsx   # Smart alerts
│   ├── TrendsScreen.tsx          # Charts & monthly history
│   ├── SavingsGoalsScreen.tsx    # Savings goals
│   ├── CategoryBudgetsScreen.tsx # Per-category monthly spending limits
│   ├── ReorderCategoriesScreen.tsx # Drag/button reorder of expense categories
│   ├── DashboardCustomizeScreen.tsx # Reorder/hide dashboard cards
│   ├── AssistantScreen.tsx       # AI chat assistant
│   ├── GlobalSearchScreen.tsx    # Unified search across all data types
│   ├── BillCalendarScreen.tsx    # Calendar view of upcoming recurring bills
│   ├── SettingsScreen.tsx        # Theme, biometric, API key, links to sub-screens
│   ├── DataTransferScreen.tsx    # Cloud backup, file transfer, transfer codes
│   └── OnboardingScreen.tsx      # First-launch walkthrough (5 steps)
├── store/
│   ├── useExpenseStore.ts        # Main Zustand store (composed from slices, persisted)
│   ├── useNotificationStore.ts   # Notification store
│   ├── useUndoStore.ts           # Transient undo entry for snackbar (not persisted)
│   ├── utils.ts                  # uuidv4 helper
│   └── slices/
│       ├── expenseSlice.ts       # Expense CRUD, tags, splits, convert-to-recurring
│       ├── incomeSlice.ts        # Income CRUD, convert-to-recurring
│       ├── budgetSlice.ts        # Budget CRUD, templates, sharing
│       ├── savingsSlice.ts       # Savings goals, auto-contributions
│       ├── settingsSlice.ts      # Settings, categories, exchange rates, dashboard config
│       └── computedSlice.ts      # Derived data: balances, totals, YoY, category status
├── types/
│   └── index.ts                  # All TypeScript interfaces, enums, constants
└── utils/
    ├── currency.ts               # CURRENCY_OPTIONS (14), formatCurrency, getCurrencySymbol
    ├── exportData.ts             # CSV export, JSON backup/restore, BackupData interface
    ├── cloudBackup.ts            # Cloud share, transfer code generation/parsing
    ├── recurringProcessor.ts     # computeDueDates, generateRecurringId for auto-processing
    ├── localNotifications.ts     # expo-notifications wrapper: permissions, scheduling
    ├── nlParser.ts               # Natural language expense parser
    ├── categorySuggester.ts      # Smart category suggestion engine (history + keywords)
    ├── budgetSharing.ts          # Budget sharing: build/validate/share/import
    ├── receiptOcr.ts             # Gemini Vision API receipt scanning
    ├── spendingInsights.ts       # Local anomaly detection and spending insights
    └── currencyFetch.ts          # Exchange rate auto-fetch from free API
├── i18n/
│   └── index.ts                  # Translation layer with t() function (English-only)

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

The store uses a **slice pattern** — each domain slice is defined in `src/store/slices/` and composed in `useExpenseStore.ts`. Type: `StoreState = ExpenseSlice & IncomeSlice & BudgetSlice & SavingsSlice & SettingsSlice & ComputedSlice`.

### State Fields
| Field | Type | Persisted | Slice | Notes |
|-------|------|-----------|-------|-------|
| `expenses` | `Expense[]` | Yes | expense | Main expense list |
| `fixedExpenses` | `FixedExpense[]` | Yes | expense | Recurring expenses |
| `incomes` | `Income[]` | Yes | income | One-time income |
| `fixedIncomes` | `FixedIncome[]` | Yes | income | Recurring income |
| `budgets` | `Budget[]` | Yes | budget | Formerly "projects" |
| `customCategories` | `CustomCategory[]` | Yes | settings | User-created categories |
| `exchangeRates` | `ExchangeRate[]` | Yes | settings | Multi-currency support |
| `savingsGoals` | `SavingsGoal[]` | Yes | savings | Savings targets |
| `budgetTemplates` | `BudgetTemplate[]` | Yes | budget | Reusable budget configs |
| `categoryOrder` | `string[]` | Yes | settings | Persisted category display order |
| `categoryBudgets` | `CategoryBudget[]` | Yes | settings | Per-category monthly limits |
| `dashboardCards` | `DashboardCardConfig[]` | Yes | settings | Dashboard card order and visibility |
| `initialBalance` | `number` | Yes | settings | Starting balance |
| `monthlyIncome` | `number` | Yes | settings | Base monthly income |
| `currencySymbol` | `string` | Yes | settings | e.g. "$", "€" |
| `themeMode` | `ThemeMode` | Yes | settings | `'dark'` or `'light'` |
| `biometricEnabled` | `boolean` | Yes | settings | Face ID / fingerprint lock |
| `pushNotificationsEnabled` | `boolean` | Yes | settings | Local push notification toggle |
| `onboardingCompleted` | `boolean` | Yes | settings | First-launch gate |
| `autoBackupReminder` | `boolean` | Yes | settings | Weekly backup reminder toggle |
| `lastBackupDate` | `string \| null` | Yes | settings | ISO date of last backup |

### Key Actions (grouped by slice)
- **ExpenseSlice:** add, addWithId (restore), update, delete, markCompleted, convertExpenseToRecurring, getAllTags
- **IncomeSlice:** add, addWithId (restore), update, delete, convertIncomeToRecurring, getMonthlyIncomes, getMonthlyExtraIncome, getTotalExtraIncomeAllTime, addFixedIncome, updateFixedIncome, deleteFixedIncome, getFixedIncomesTotal
- **BudgetSlice:** add, addWithId (restore), update, delete, getExpenses, getTotal, getPendingTotal, importSharedBudget, addTemplate, deleteTemplate, createFromTemplate
- **SavingsSlice:** add, addWithId (restore), update, delete, addFunds, processAutoContributions
- **SettingsSlice:** setInitialBalance, setMonthlyIncome, setCurrencySymbol, setThemeMode, setBiometricEnabled, setPushNotificationsEnabled, setOnboardingCompleted, addCustomCategory, deleteCustomCategory, setCategoryOrder, setDashboardCards, resetDashboardCards, addExchangeRate, updateExchangeRate, deleteExchangeRate, convertToBase, setCategoryBudget, removeCategoryBudget, toggleCategoryBudget, getCategoryBudgetStatus
- **ComputedSlice:** getMonthlyExpenses, getMonthlyTotal, getMonthlyBalance, getOverallBalance, getCategoryTotals (split-aware), getYearOverYearData, processRecurringExpenses, getBackupState, restoreFromBackup

### Persistence
- Storage: AsyncStorage via `zustand/middleware/persist`
- Store key: `'expense-store'`
- Version: 1
- Migration: renames `projects` → `budgets`

---

## Navigation Map

```
Stack.Navigator (headerShown: false)
├── Main (TabNavigator — 5 tabs)
│   ├── Dashboard  → DashboardScreen
│   ├── Expenses   → ExpenseListScreen
│   ├── Income     → IncomeListScreen
│   ├── Budgets    → ProjectsScreen
│   └── Fixed      → FixedExpensesScreen (label: "Recurring")
├── AddExpense     (modal, slide_from_bottom)
├── AddIncome      (modal, slide_from_bottom)
├── BudgetDetail   (slide_from_right)
├── Notifications  (slide_from_right)
├── Trends         (slide_from_right)
├── SavingsGoals   (slide_from_right)
├── Settings       (slide_from_right)
├── DataTransfer   (slide_from_right)
├── ReorderCategories (slide_from_right)
├── CategoryBudgets (slide_from_right)
├── DashboardCustomize (slide_from_right)
├── Assistant      (slide_from_right)
├── IncomeList     (slide_from_right, also accessible from quick actions)
├── GlobalSearch   (slide_from_right, accessible from Dashboard search icon)
└── BillCalendar   (slide_from_right, accessible from Recurring tab calendar icon)
```

---

## Theme System

- **Palettes:** `DARK_COLORS` / `LIGHT_COLORS` in `src/constants/theme.ts`
- **Provider:** `ThemeProvider` in `src/contexts/ThemeContext.tsx` reads `themeMode` from store
- **Hook:** `useTheme()` → `{ colors, isDark, mode, toggle, setMode }`
- **Modes:** `'dark'` | `'light'` | `'system'` — system mode follows device appearance via `Appearance` API
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
| expo-notifications | ~0.31.2 | Local push notifications |
| formik + yup | ^2.4.9 / ^1.7.1 | Form validation |

---

## Data Types Quick Reference

```typescript
Expense:       { id, amount, category, description, date, isFixed, projectId?, isPending?, currency?, receiptUri?, tags?, splits? }
ExpenseSplit:  { category, amount, projectId? }
FixedExpense:  { id, amount, category, description, frequency?, startDate?, lastProcessedDate? }
Income:        { id, amount, source: IncomeSource, description, date }
FixedIncome:   { id, amount, source, description, frequency?, startDate?, lastProcessedDate? }
Budget:        { id, name, description, budget?, color, status, createdAt }
CustomCategory:{ name, icon, color }
SavingsGoal:   { id, name, targetAmount, currentAmount, deadline?, color, icon, createdAt }
BudgetTemplate:{ id, name, description, budget?, color, icon, createdAt }
CategoryBudget:{ category, monthlyLimit, enabled }
ExchangeRate:  { from, rate }
DashboardCardConfig: { id: DashboardCardId, visible }
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
