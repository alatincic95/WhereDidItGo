# WhereDidItGo — Functionalities Checklist

> A living to-do list of every feature in the app. Checked items are implemented. Unchecked items at the bottom are proposed/missing.
>
> **Last updated:** 2026-04-13

---

## ✅ Implemented

### Expense Management
- [x] Add new expense (amount, category, description, date)
- [x] Edit existing expense
- [x] Delete expense (with confirmation modal)
- [x] 10 built-in categories (Food, Transport, Housing, Entertainment, Shopping, Health, Education, Bills, Subscriptions, Other)
- [x] Tap expense card to edit
- [x] FAB on Dashboard and Expenses tab for quick add
- [x] Link expense to a budget (optional `projectId`)
- [x] Pending expense flag (deduct now vs. when completed)
- [x] Mark pending expense as complete (checkmark button in BudgetDetail)
- [x] Attach receipt photo via camera or gallery (`expo-image-picker`)
- [x] Inline receipt preview in add/edit screen
- [x] Replace or remove attached receipts
- [x] Full-screen receipt viewer on tap
- [x] Per-expense currency tagging (multi-currency)

### Income Management
- [x] Add one-time income entries
- [x] Edit / delete income (with confirmation)
- [x] 7 income sources (Gift, Bonus, Freelance, Sale, Refund, Investment, Other)
- [x] Icons and colors per income source
- [x] Income reflected in monthly and overall balance

### Recurring (Fixed) Expenses & Income
- [x] Add recurring expense with configurable frequency
- [x] Edit / delete recurring expense (with confirmation)
- [x] Add recurring income with configurable frequency
- [x] Edit / delete recurring income
- [x] 5 frequency options: weekly, bi-weekly, monthly, quarterly, yearly
- [x] Amounts auto-converted to monthly equivalents in balance calculations
- [x] Frequency badge on each recurring item
- [x] Per-period label on amounts (e.g., "$1,200/month")
- [x] Backward compatibility: items without frequency default to monthly
- [x] Dedicated Recurring tab with expenses/income toggle

### Expense Filtering (ExpenseListScreen)
- [x] Search by description/category
- [x] Filter by category (multi-select, incl. custom)
- [x] Filter by amount range (min/max)
- [x] Sort by date, highest amount, lowest amount
- [x] Month selector dropdown
- [x] "All" option to view expenses across all months
- [x] Flat list rendering preserves sort order when sorting by amount

### Balance Tracking
- [x] Monthly balance = income + fixed income + extra income − expenses − fixed expenses
- [x] Overall balance = initial balance + accumulated monthly balances
- [x] View mode toggle (Monthly / Overall) on Dashboard
- [x] Set initial balance (editable)
- [x] Set monthly income (editable via modal)
- [x] Animated balance number display
- [x] Hero card with gradient backgrounds

### Budgets (formerly "Projects")
- [x] Create budget (name, description, optional limit, color)
- [x] Edit / delete budget (with confirmation)
- [x] 12 color options
- [x] Budget list screen with progress bars
- [x] Budget detail screen with hero card (committed + pending totals)
- [x] Link expenses to budget via selector
- [x] Committed vs. pending totals displayed separately
- [x] Progress bar shows committed (solid) + pending (translucent)
- [x] Pending expenses shown with dashed border
- [x] Mark pending expense complete from budget detail
- [x] Active / completed status toggle
- [x] Category breakdown within budget detail

### Budget Templates
- [x] Save budget config as reusable template
- [x] Template list via bookmark icon in Budgets header
- [x] One-tap budget creation from template
- [x] Long-press template to delete (with confirmation)

### Category Budgets (Per-Category Monthly Limits)
- [x] Set monthly spending limit per category
- [x] Edit / remove limits
- [x] Enable / disable per-category limits (via Switch)
- [x] Summary card: total allocated vs. monthly income with allocation bar
- [x] Progress bars color-coded (default → warning at 80% → danger at 100%)
- [x] Dashboard category breakdown shows "of $X" limit text
- [x] Dashboard "OVER" badge when category exceeded
- [x] Progress bar fills relative to budget limit (not max category)
- [x] Dedicated CategoryBudgets screen accessible from Settings
- [x] Includes one-time + recurring expenses with currency conversion

### Custom Categories
- [x] Create custom category (name, icon, color)
- [x] 24 Material Icons options
- [x] 12 color options
- [x] Create inline from AddExpense screen
- [x] Custom categories available across all screens
- [x] `CategoryIcon` component auto-resolves custom icon/color
- [x] Delete custom category (removes from category order too)

### Category Ordering
- [x] Reorder categories via drag or button controls
- [x] Dedicated ReorderCategories screen (Settings link)
- [x] Persisted order used across forms and lists
- [x] New categories append after saved order

### Multi-Currency Support
- [x] 14 base currency options
- [x] Configurable base currency symbol
- [x] Exchange rates (base-per-foreign)
- [x] Add / update / delete exchange rates via modal
- [x] Expense-level currency tagging
- [x] Auto-conversion to base currency in all calculations
- [x] Currency picker modal on Dashboard

### Trends & Analytics
- [x] Bar chart visualization of last 6 months (custom-built, no chart library)
- [x] Toggle views: Expenses / Income / Both
- [x] Month-over-month spending % change
- [x] Category breakdown for current month
- [x] Monthly summary table
- [x] Accessible from Dashboard quick-action card

### Savings Goals
- [x] Create savings goal (name, target, optional deadline, color, icon)
- [x] Edit goal
- [x] Delete goal (with confirmation)
- [x] 20 icon options, 12 color options
- [x] Add funds incrementally
- [x] Auto-calculated monthly amount needed until deadline
- [x] Progress bar with percentage
- [x] Summary card showing total saved vs. total target
- [x] Accessible from Dashboard quick-action card

### Smart Notifications
- [x] Monthly budget warnings (75%, 90%, exceeded)
- [x] Project budget alerts (80%, 100%)
- [x] Category budget alerts (80%, exceeded)
- [x] Bill reminders at start of month (days 1–5)
- [x] Welcome tip for new users
- [x] "Track first expense" milestone
- [x] Notifications screen with delete / clear-all (with confirmation)
- [x] Unread count badge on Dashboard bell icon
- [x] Mark as read / mark all as read
- [x] Deduplication via `type-relatedId` key

### Dashboard
- [x] Greeting with time-of-day
- [x] Monthly / Overall view toggle
- [x] Hero balance card (gradient, sparkles, metadata)
- [x] Summary cards (monthly expenses, income)
- [x] Spending progress card with threshold colors
- [x] Top Categories breakdown with progress bars
- [x] Quick action cards (Trends, Goals)
- [x] Recent transactions list (mixed expenses + income)
- [x] FAB with expand for Expense / Income
- [x] Currency picker, exchange rate, backup/restore, settings gear in header
- [x] Notification bell with unread badge
- [x] Animated fade/slide entry for all cards
- [x] Inline monthly income edit modal

### Theme System (Dark / Light Mode)
- [x] Full light and dark palettes (`DARK_COLORS`, `LIGHT_COLORS`)
- [x] `ThemeContext` + `useTheme()` hook
- [x] Toggle from Settings and Onboarding
- [x] Persisted in Zustand store
- [x] Dynamic `colors.background` on all containers
- [x] GlassCard adapts glow/border per theme
- [x] Tab bar adapts background per theme
- [x] StatusBar style auto-switches

### Biometric Lock
- [x] Face ID / Fingerprint authentication (`expo-local-authentication`)
- [x] Toggle in Settings (requires successful auth to enable)
- [x] BiometricGate blocks app launch until authenticated
- [x] Fallback to device passcode
- [x] Graceful degradation: no hardware, not enrolled, web platform
- [x] Lock screen with "Tap to Unlock" button on failure
- [x] Auto-detect biometric type (Face ID vs. Fingerprint) in UI labels

### Onboarding Flow
- [x] First-launch walkthrough gated by `onboardingCompleted` flag
- [x] 5 steps: Welcome, Currency, Income, Categories, Confirmation
- [x] Animated transitions with progress dots
- [x] Theme toggle on welcome step
- [x] Currency picker
- [x] Income input with currency prefix
- [x] Category grid with toggleable chips (pre-selects 4 defaults)
- [x] Saves settings to Zustand store on completion

### Data Backup & Transfer
- [x] JSON backup via native share sheet (iCloud Drive, Google Drive, Dropbox, etc.)
- [x] Backup metadata (app name, version, export date)
- [x] Restore from JSON file via document picker
- [x] Restore confirmation modal with backup stats
- [x] Base64 transfer code generation for device-to-device migration
- [x] Copy/share transfer code
- [x] Import transfer code to restore
- [x] Dedicated DataTransfer screen accessible from Settings
- [x] Includes categoryBudgets in backup/restore payload

### Data Export
- [x] CSV export of all expenses, incomes, fixed expenses, fixed incomes
- [x] Exported via native share sheet (Dashboard backup menu)

### Data Persistence
- [x] Zustand `persist` middleware + AsyncStorage
- [x] Persisted state: expenses, fixedExpenses, incomes, fixedIncomes, budgets, customCategories, categoryOrder, categoryBudgets, exchangeRates, savingsGoals, budgetTemplates, initialBalance, monthlyIncome, currencySymbol, themeMode, biometricEnabled, onboardingCompleted
- [x] Migration support (projects → budgets rename)
- [x] Survives app restarts, force closes, device reboots

### UI / UX Components
- [x] GlassCard (glass-morphism, theme-aware)
- [x] AnimatedNumber (animated numeric display)
- [x] CategoryIcon (dynamic icon resolver)
- [x] LinearGradient backgrounds
- [x] Custom Modal-based confirmations (no `Alert.alert`)
- [x] Consistent spacing, font sizes, border radii, shadows constants

### Navigation
- [x] Bottom tabs: Dashboard, Expenses, Budgets, Recurring
- [x] Stack modals: AddExpense, AddIncome
- [x] Stack slides: BudgetDetail, Notifications, Trends, SavingsGoals, Settings, DataTransfer, ReorderCategories, CategoryBudgets
- [x] BiometricGate and OnboardingGate at app root

---

## ⬜ Missing / Proposed Features

### High Priority
- [ ] **Push Notifications** — integrate `expo-notifications` so budget alerts and bill reminders fire when the app is closed
- [ ] **Recurring expense auto-processing** — auto-generate actual expense entries each period so recurring items appear in trends and lists
- [ ] **Export UI for CSV** — currently CSV export exists in utils but only reachable via Dashboard backup menu; add dedicated export screen or button in Expenses tab
- [ ] **Year-over-year trends** — compare same-month across years (Trends currently only shows last 6 months)

### Medium Priority
- [ ] **Tags / labels** on expenses — cross-cutting labels beyond a single category (e.g., "Vacation", "Tax-deductible")
- [ ] **Split transactions** — split one purchase across multiple categories or budgets
- [ ] **Live exchange rates** — auto-fetch from a public API (e.g., exchangerate.host) instead of manual entry
- [ ] **Receipt OCR** — parse amount, date, and vendor from receipt photos to auto-fill expense fields
- [ ] **Savings goal auto-contributions** — optional monthly auto-allocation toward a goal
- [ ] **Undo delete (snackbar)** — brief undo toast after deleting expense/income/budget/goal
- [ ] **Convert one-time expense to recurring** — option in edit screen to promote/demote recurrence

### Nice to Have
- [ ] **Dashboard customization** — reorder or hide dashboard cards
- [ ] **Shared budgets / expense splitting** — couples or roommates splitting expenses
- [ ] **Scheduled auto-backup** — reminder or automatic periodic backup
- [ ] **Home screen widgets** — quick-add expense without opening the app (requires `expo prebuild`, not Expo Go)
- [ ] **Expense notes / attachments beyond receipts** — attach multiple photos or PDFs
- [ ] **Search across all data** — unified search across expenses, incomes, budgets, goals, recurring items
- [ ] **Category budget carry-over** — unused budget rolls to next month
- [ ] **Dark mode scheduling** — auto-switch based on system setting or time of day
- [ ] **Multi-language / localization (i18n)** — currently English-only
- [ ] **Accessibility audit** — VoiceOver / TalkBack labels, dynamic font sizing support
