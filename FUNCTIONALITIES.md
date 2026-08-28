# WhereDidItGo — Functionalities Checklist

> A living to-do list of every feature in the app. Checked items are implemented. Unchecked items at the bottom are proposed/missing.
>
> **Last updated:** 2026-08-27

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
- [x] Tags / labels on expenses — cross-cutting labels (e.g. "Vacation", "Tax-deductible") with autocomplete from previously-used tags
- [x] Split transactions — distribute a single expense across multiple categories and/or budgets (sum validated against amount)
- [x] Convert one-time expense to recurring — promote an existing expense to a fixed/recurring entry from the edit screen

### Income Management

- [x] Add one-time income entries
- [x] Edit / delete income (with confirmation)
- [x] 7 income sources (Gift, Bonus, Freelance, Sale, Refund, Investment, Other)
- [x] Icons and colors per income source
- [x] Income reflected in monthly and overall balance
- [x] Dedicated Income tab in bottom navigation (filterable list)
- [x] Search by description/source
- [x] Filter by source (multi-select), amount range (min/max)
- [x] Sort by date, highest amount, lowest amount
- [x] Month selector with "All" option
- [x] Convert one-time income to recurring from edit screen (frequency picker)
- [x] Delete income button with confirmation in edit screen
- [x] Green accent branding (#00D68F) for income screens

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
- [x] Optional monthly auto-contributions (idempotent per month via `lastAutoContribution`, capped at remaining target)

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
- [x] Persisted state: expenses, fixedExpenses, incomes, fixedIncomes, budgets, customCategories, categoryOrder, categoryBudgets, dashboardCards, exchangeRates, savingsGoals, budgetTemplates, initialBalance, monthlyIncome, currencySymbol, themeMode, biometricEnabled, onboardingCompleted
- [x] Migration support (projects → budgets rename)
- [x] Survives app restarts, force closes, device reboots

### UI / UX Components

- [x] GlassCard (glass-morphism, theme-aware)
- [x] AnimatedNumber (animated numeric display)
- [x] CategoryIcon (dynamic icon resolver)
- [x] LinearGradient backgrounds
- [x] Custom Modal-based confirmations (no `Alert.alert`)
- [x] Consistent spacing, font sizes, border radii, shadows constants
- [x] UndoSnackbar — animated bottom snackbar with 5-second auto-dismiss; restores deleted expense/income/budget/savings goal preserving original IDs

### Dashboard Customization

- [x] Reorder dashboard cards via dedicated DashboardCustomize screen
- [x] Toggle individual cards visible or hidden (Summary, Budget Usage, Categories, Quick Actions, Recent Transactions)
- [x] Reset to default layout button
- [x] Card order and visibility persisted in Zustand store
- [x] Accessible from Settings → Customize Dashboard
- [x] Hero card and header always shown (not customizable)

### Push Notifications

- [x] Local push notifications via `expo-notifications` (no remote push)
- [x] Budget threshold alerts fire as push when app is backgrounded (75%, 90%, 100%)
- [x] Category budget alerts as push (80%, 100%)
- [x] Bill reminders scheduled for 1st of next month
- [x] Settings toggle to enable/disable push notifications
- [x] Foreground notification handling (show alert + sound)
- [x] Graceful web degradation (toggle hidden on web)

### Recurring Expense Auto-Processing

- [x] Auto-generate actual expense entries from recurring items on app launch
- [x] Deterministic IDs (`recurring-{fixedId}-{YYYY-MM-DD}`) for idempotency
- [x] Track `startDate` and `lastProcessedDate` per recurring item
- [x] Supports all 5 frequencies (weekly, biweekly, monthly, quarterly, yearly)
- [x] Existing items default to current month start for backward compatibility
- [x] Auto-generated entries excluded from balance calculations (no double-counting)
- [x] Same logic applies to recurring income → auto-generated income entries
- [x] Recurring badge (autorenew icon) shown on auto-generated entries in expense list

### Export UI

- [x] CSV export button (file-download icon) in Expenses tab search bar
- [x] Exports all expenses, incomes, recurring expenses, recurring incomes via share sheet
- [x] Existing Dashboard backup menu export also retained

### Year-over-Year Trends

- [x] Time range selector: 6 Mo (default), 12 Mo, Year over Year
- [x] 12-month view shows last 12 months with narrower bars
- [x] YoY grouped bar chart: same month across years with distinct color per year
- [x] YoY comparison summary card (e.g. "Apr 2026 vs Apr 2025: +12.3%")
- [x] YoY summary table with year columns side by side
- [x] Horizontal scroll for YoY chart when many months have data
- [x] Capped at 3 most recent years per month
- [x] Store computed `getYearOverYearData()` groups tracked months by month-of-year

### Natural Language Quick-Add

- [x] Dashboard QuickAddBar for typing expenses in plain text
- [x] Parser handles: "coffee 4.50", "45 groceries", "$12 lunch", "uber 23 transport"
- [x] Extracts amount, description, and category hint from free-form input
- [x] Preview card shows parsed result with suggested category before confirming
- [x] One-tap add with success animation feedback
- [x] Supports currency symbol prefixes ($, €, £, ¥, etc.)
- [x] Utility: `src/utils/nlParser.ts`, Component: `src/components/dashboard/QuickAddBar.tsx`

### Smart Category Suggestions

- [x] History-based learning from past description→category pairs
- [x] Keyword dictionary fallback (80+ terms: uber→Transport, netflix→Subscriptions, etc.)
- [x] Exact description match at 95% confidence
- [x] Word-frequency scoring for partial matches
- [x] Suggestion chip above category grid in AddExpenseScreen (≥40% confidence)
- [x] Tap to auto-select suggested category
- [x] All processing local, no cloud dependency
- [x] Utility: `src/utils/categorySuggester.ts`

### Budget Sharing

- [x] Share budget + linked expenses via native share sheet (JSON file)
- [x] Generate base64 transfer code for copy/paste sharing
- [x] Import shared budgets via paste-and-import modal in Budgets screen
- [x] Imported budgets get new IDs (no collision)
- [x] Duplicate detection by name + color
- [x] Share button in Budget Detail screen header
- [x] Import button in Budgets screen header
- [x] No cloud or account required — peer-to-peer
- [x] Utility: `src/utils/budgetSharing.ts`

### AI Assistant

- [x] Chat-based financial assistant powered by Gemini API
- [x] Contextual awareness of user's expenses, income, budgets, and savings goals
- [x] Tool-based architecture: assistant can query store data to answer questions
- [x] Suggested prompts for common financial queries
- [x] Requires Gemini API key (configured in Settings)
- [x] Chat input bar with send button
- [x] Message bubbles (user/assistant)

### Receipt OCR

- [x] Scan receipt photos to auto-extract amount, description, category, and date
- [x] Uses Gemini Vision API (gemini-2.0-flash model)
- [x] Requires API key configured in Settings (stored in AsyncStorage)
- [x] "Scan Receipt" button appears in AddExpense receipt section when API key is set
- [x] Handles rate limiting and invalid key errors gracefully

### Store Architecture

- [x] Zustand store refactored to slice pattern (6 slices)
- [x] Slices: expenseSlice, incomeSlice, budgetSlice, savingsSlice, settingsSlice, computedSlice
- [x] Component extraction: dashboard, expense, budget, assistant sub-component folders

### Navigation

- [x] Bottom tabs: Dashboard, Expenses, Income, Budgets, Recurring
- [x] Stack modals: AddExpense, AddIncome
- [x] Stack slides: BudgetDetail, Notifications, Trends, SavingsGoals, Settings, DataTransfer, ReorderCategories, CategoryBudgets, DashboardCustomize, Assistant, IncomeList
- [x] BiometricGate and OnboardingGate at app root

---

## ⬜ Missing / Proposed Features

### High Priority

- [x] **Push Notifications** — integrate `expo-notifications` so budget alerts and bill reminders fire when the app is closed
- [x] **Recurring expense auto-processing** — auto-generate actual expense entries each period so recurring items appear in trends and lists
- [x] **Export UI for CSV** — dedicated export button in Expenses tab header (file-download icon) alongside existing Dashboard backup menu
- [x] **Year-over-year trends** — time range selector (6 Mo / 12 Mo / Year over Year) with grouped bar chart comparing same month across years
- [x] **Unit tests for store/calculations** — 107 tests across 9 suites covering balance calculations, currency conversion, recurring processing, split validation, and all store slices
- [x] **Unified search across all data** — GlobalSearchScreen with search across expenses, incomes, budgets, recurring items, and savings goals; type filter chips; navigates to item on tap; accessible via search icon in Dashboard header
- [x] **Error boundaries** — ErrorBoundary component wrapping every screen (tabs + stack); catches React errors per-screen with retry button; prevents full app crashes

### Medium Priority

- [x] **Receipt OCR** — parse amount, date, vendor, and category from receipt photos via Gemini Vision API (requires API key in Settings)
- [x] **Monthly recap push notification** — scheduled for last day of month at 8 PM; fires via expo-notifications with spending summary prompt
- [x] **Proactive spending insights** — local anomaly detection engine (`src/utils/spendingInsights.ts`) surfaces category spikes, spending pace warnings, no-spend streaks, and month-over-month comparison on Dashboard
- [x] **Date range filtering** — YYYY-MM-DD date range inputs in ExpenseListScreen filter modal; works alongside month selector and other filters
- [x] **Recurring item pause** — `paused` flag on FixedExpense/FixedIncome; paused items skip auto-processing, balance calculations, and bill calendar; pause/resume toggle in edit modal; visual "Paused" badge on list items
- [x] **Bill calendar view** — `BillCalendarScreen` with mini calendar grid, month navigator, bills-due/income-due summary cards, day-grouped upcoming list; accessible via calendar icon in Recurring tab header
- [x] **Budget rollover (carry-over)** — `rolloverEnabled` flag per CategoryBudget; unused budget auto-carries to next month via `processRollovers()` on app launch; effective limit = base + rollover; toggle in settings slice
- [x] **i18n preparation** — `src/i18n/index.ts` translation layer with `t()` function, full English string catalog, `setLocale()` for future languages; ships English-only

### Nice to Have

- [x] **Dashboard customization** — reorder or hide dashboard cards
- [x] **Shared budgets** — share individual budgets with linked expenses via transfer code or file (peer-to-peer, no cloud)
- [x] **Scheduled auto-backup** — weekly backup reminder notification when enabled; tracks `lastBackupDate`, schedules via `scheduleBackupReminder()`; toggle in Settings
- [ ] **Home screen widgets** — quick-add expense without opening the app (requires `expo prebuild`, not Expo Go)
- [ ] **Expense notes / attachments beyond receipts** — attach multiple photos or PDFs
- [x] **Dark mode scheduling** — three theme modes: Dark, Light, System; system mode follows device appearance via `Appearance` API with real-time listener; selector in Settings
- [x] **Accessibility audit** — tab bar labels, dashboard header buttons, FABs, undo snackbar all have `accessibilityLabel`/`accessibilityRole`; snackbar uses `accessibilityLiveRegion`
- [x] **Navigate from generated recurring entry to parent** — tapping auto-generated recurring expense navigates to Recurring tab
- [x] **Undo for edits** — editing an expense or income shows 5-second undo snackbar to restore previous state
- [x] **Bulk operations** — long-press to multi-select expenses; bulk delete and bulk re-categorize with undo support; selection bar with count
- [x] **Empty state guidance** — enhanced hints on Expenses, Income, Recurring expenses, Recurring income screens with actionable guidance
- [x] **Currency auto-detection / rate fetch** — one-tap "Sync Exchange Rates" in Settings fetches from free open-source API; auto-detects base currency; updates all 14 currencies
