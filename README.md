# WhereDidItGo

A mobile expense tracking app for iOS, Android, and Web built with React Native and Expo. Track your spending, income, recurring bills, and budgets — all stored locally on your device.

## Features

### Expense Tracking
- Log expenses with amount, category, description, and date
- Edit or delete existing expenses with confirmation prompts
- 10 built-in categories (Food, Transport, Housing, Entertainment, Shopping, Health, Education, Bills, Subscriptions, Other)
- Create custom categories with your own name, icon, and color
- Search, filter by category or amount range, and sort by date or amount
- View expenses for a specific month or across all time
- Attach receipt photos via camera or gallery picker
- Reorder categories to prioritize your most-used ones

### Income Tracking
- Record one-time income from various sources: Gift, Bonus, Freelance, Sale, Refund, Investment, Other
- Recurring income with configurable frequency (weekly, bi-weekly, monthly, quarterly, yearly)
- Income is automatically reflected in both monthly and overall balance

### Balance Overview
- **Monthly balance**: income + fixed income + extra income - expenses - recurring expenses for the current month
- **Overall balance**: accumulated balance across all tracked months starting from an initial balance
- Visual budget usage indicator on the dashboard
- Category breakdown showing where your money goes

### Budgets
- Create named budgets for specific goals (trips, renovations, events, purchases)
- Set an optional spending limit and choose a color
- Link expenses to a budget when adding them
- **Pending expenses**: choose whether an expense is deducted from the budget immediately or only when you mark it as completed
- Progress bar shows committed spending (solid) and pending amounts (translucent)
- Mark budgets as active or completed
- Save budget configurations as reusable templates

### Category Budgets
- Set monthly spending limits for individual categories (e.g., "$400/month on Food")
- Progress bars color-coded by threshold: default color → yellow at 80% → red at 100%
- Enable/disable individual category limits without deleting them
- Summary card showing total allocated vs monthly income
- Dashboard category breakdown enhanced with budget indicators and "OVER" badges
- Smart notifications at 80% and 100% of each category limit
- Manage via Settings → Category Budgets

### Recurring Expenses & Income
- Track recurring charges with configurable frequency: weekly, bi-weekly, monthly, quarterly, yearly
- Amounts auto-converted to monthly equivalents for balance calculations
- Frequency badge and per-period labels on each item
- Managed through a dedicated Recurring tab with expenses/income toggle

### Monthly History / Trends
- Bar chart visualization of spending and income over time (last 6 months)
- Toggle between Expenses, Income, or Both views
- Month-over-month spending comparison with percentage change
- Category breakdown for current month
- Monthly summary table

### Savings Goals
- Set target amount and optional deadline
- Track progress with auto-calculated monthly amount needed
- Add funds incrementally with progress bar and percentage
- 20 icon options, 12 color options

### Smart Notifications
- Monthly budget warnings at 75%, 90%, and exceeded
- Budget-specific warnings at 80% and 100% of spending limits
- Category budget warnings at 80% and exceeded
- Bill reminders at the start of each month

### Multi-Currency Support
- Configurable base currency (14 options)
- Exchange rates for foreign currency expenses
- Auto-conversion to base currency in all calculations

### Dark Mode / Theme Toggle
- Full light and dark theme support
- Toggle accessible from Settings and Onboarding
- Persisted across app restarts

### Biometric Lock
- Face ID / Fingerprint authentication to protect financial data
- Toggle in Settings, with fallback to device passcode

### Cloud Backup & Data Transfer
- Share JSON backup via native share sheet (iCloud Drive, Google Drive, Dropbox, etc.)
- Restore from backup file with confirmation modal
- Transfer code generation for device-to-device migration
- CSV export for spreadsheet use

### Onboarding
- First-launch walkthrough: currency, income, category selection, theme toggle
- Animated transitions with progress dots

### Data Persistence
- All data stored locally on device using AsyncStorage
- No account required, no internet connection needed
- Data survives app restarts, force closes, and device reboots

## Screenshots

The app supports both dark and light themes with accent colors and smooth animations throughout.

## Getting Started

### Prerequisites
- Node.js
- Expo CLI (`npm install -g expo-cli`)

### Installation

```bash
git clone <repository-url>
cd WhereDidItGo
npm install
```

### Running the App

```bash
# Start the development server
npx expo start

# Run on web
npx expo start --web

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android
```

## Tech Stack

- **React Native** + **TypeScript**
- **Expo** (SDK 54)
- **React Navigation** (bottom tabs + native stack)
- **Zustand** for state management with persist middleware
- **AsyncStorage** for local data persistence
- **expo-linear-gradient** and **@expo/vector-icons** for UI
- **expo-local-authentication** for biometric lock
- **expo-image-picker** for receipt photos
- **formik** + **yup** for form validation
