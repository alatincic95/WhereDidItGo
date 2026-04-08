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

### Income Tracking
- One-time income entries (gifts, bonuses, freelance, sales, refunds, investments)
- Added to both monthly and overall balance automatically
- Sources: Gift, Bonus, Freelance, Sale, Refund, Investment, Other

### Fixed/Recurring Expenses
- Monthly recurring charges (rent, subscriptions, bills)
- Shown in expense list with recurring badge
- Managed via dedicated Recurring tab
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

### Smart Notifications
- Budget warnings (75%, 90%, exceeded)
- Budget item alerts (80%, 100%)
- Bill reminders
- All confirmation dialogs use custom Modal (not Alert.alert)

### Data Persistence
- Zustand persist middleware + AsyncStorage
- Migration support (projects → budgets key rename)
- Survives app restarts, force closes, device reboots

---

## Data Model

### Expense
- id, amount, category, description, date, isFixed, projectId?, isPending?

### FixedExpense
- id, amount, category, description

### Income
- id, amount, source (IncomeSource), description, date

### Budget (formerly Project)
- id, name, description, budget?, color, status (BudgetStatus), createdAt

### CustomCategory
- name, icon, color

---

## Screens

- **Dashboard** — balance cards, budget usage, category breakdown, recent transactions, FAB (income/expense)
- **Expenses** — filterable list with search, category/amount filters, sort, month selector with "All" option, FAB for adding expense
- **Budgets** — budget list with spending progress, pending totals, detail view
- **BudgetDetail** — hero card (committed + pending), stats, category breakdown, pending/committed expense lists, mark-complete button
- **Recurring** — fixed expense management
- **AddExpense** — modal for add/edit expense (with delete confirmation, budget selector, pending toggle, custom category creation)
- **AddIncome** — modal for add/edit income (with delete confirmation)
- **Notifications** — smart alerts with delete/clear confirmation modals

---

## Navigation

- Bottom tabs: Dashboard, Expenses, Budgets, Recurring
- Stack screens: AddExpense (modal), AddIncome (modal), BudgetDetail (slide), Notifications (slide)

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
