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

### Income Tracking
- Record one-time income from various sources: Gift, Bonus, Freelance, Sale, Refund, Investment, Other
- Income is automatically reflected in both monthly and overall balance

### Balance Overview
- **Monthly balance**: income + extra income - expenses - recurring expenses for the current month
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

### Recurring Expenses
- Track monthly recurring charges like rent, subscriptions, and bills
- Automatically factored into your monthly balance calculation
- Managed through a dedicated tab

### Smart Notifications
- Alerts when you hit 75%, 90%, or exceed your monthly budget
- Budget-specific warnings at 80% and 100% of spending limits
- Bill reminders at the start of each month

### Data Persistence
- All data stored locally on device using AsyncStorage
- No account required, no internet connection needed
- Data survives app restarts, force closes, and device reboots

## Screenshots

The app uses a dark theme with accent colors and smooth animations throughout.

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
