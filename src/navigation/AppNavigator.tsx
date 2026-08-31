import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';

import { DashboardScreen } from '../screens/DashboardScreen';
import { ExpenseListScreen } from '../screens/ExpenseListScreen';
import { AddExpenseScreen } from '../screens/AddExpenseScreen';
import { FixedExpensesScreen } from '../screens/FixedExpensesScreen';
import { ProjectsScreen } from '../screens/ProjectsScreen';
import { ProjectDetailScreen } from '../screens/ProjectDetailScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { AddIncomeScreen } from '../screens/AddIncomeScreen';
import { TrendsScreen } from '../screens/TrendsScreen';
import { SavingsGoalsScreen } from '../screens/SavingsGoalsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { DataTransferScreen } from '../screens/DataTransferScreen';
import { ReorderCategoriesScreen } from '../screens/ReorderCategoriesScreen';
import { CategoryBudgetsScreen } from '../screens/CategoryBudgetsScreen';
import { DashboardCustomizeScreen } from '../screens/DashboardCustomizeScreen';
import { AssistantScreen } from '../screens/AssistantScreen';
import { IncomeListScreen } from '../screens/IncomeListScreen';
import { GlobalSearchScreen } from '../screens/GlobalSearchScreen';
import { BillCalendarScreen } from '../screens/BillCalendarScreen';
import { AnnualReportScreen } from '../screens/AnnualReportScreen';
import { AccountsScreen } from '../screens/AccountsScreen';
import { CryptoScreen } from '../screens/CryptoScreen';
import { DebtPayoffScreen } from '../screens/DebtPayoffScreen';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useTheme } from '../contexts/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Wrap screen components with ErrorBoundary
function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  title: string
): React.FC<P> {
  return (props: P) => (
    <ErrorBoundary fallbackTitle={`${title} failed to load`}>
      <Component {...props} />
    </ErrorBoundary>
  );
}

const SafeDashboard = withErrorBoundary(DashboardScreen, 'Dashboard');
const SafeExpenseList = withErrorBoundary(ExpenseListScreen, 'Expenses');
const SafeIncomeList = withErrorBoundary(IncomeListScreen, 'Income');
const SafeProjects = withErrorBoundary(ProjectsScreen, 'Budgets');
const SafeFixedExpenses = withErrorBoundary(FixedExpensesScreen, 'Recurring');
function TabNavigator() {
  const { colors, isDark } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark
            ? 'rgba(15, 15, 26, 0.95)'
            : 'rgba(245, 246, 250, 0.95)',
          borderTopWidth: 1,
          borderTopColor: `${colors.primary}15`,
          height: 85,
          paddingTop: 8,
          paddingBottom: 28,
          position: 'absolute',
          elevation: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={SafeDashboard}
        options={{
          tabBarAccessibilityLabel: 'Dashboard tab',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={SafeExpenseList}
        options={{
          tabBarAccessibilityLabel: 'Expenses tab',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="receipt-long" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Income"
        component={SafeIncomeList}
        options={{
          tabBarAccessibilityLabel: 'Income tab',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="account-balance" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Budgets"
        component={SafeProjects}
        options={{
          tabBarAccessibilityLabel: 'Budgets tab',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="account-balance-wallet" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Fixed"
        component={SafeFixedExpenses}
        options={{
          tabBarLabel: 'Recurring',
          tabBarAccessibilityLabel: 'Recurring expenses and income tab',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="autorenew" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const SafeAddExpense = withErrorBoundary(AddExpenseScreen, 'Add Expense');
const SafeAddIncome = withErrorBoundary(AddIncomeScreen, 'Add Income');
const SafeBudgetDetail = withErrorBoundary(ProjectDetailScreen, 'Budget Detail');
const SafeNotifications = withErrorBoundary(NotificationsScreen, 'Notifications');
const SafeTrends = withErrorBoundary(TrendsScreen, 'Trends');
const SafeSavingsGoals = withErrorBoundary(SavingsGoalsScreen, 'Savings Goals');
const SafeSettings = withErrorBoundary(SettingsScreen, 'Settings');
const SafeDataTransfer = withErrorBoundary(DataTransferScreen, 'Data Transfer');
const SafeReorderCategories = withErrorBoundary(ReorderCategoriesScreen, 'Reorder Categories');
const SafeCategoryBudgets = withErrorBoundary(CategoryBudgetsScreen, 'Category Budgets');
const SafeDashboardCustomize = withErrorBoundary(DashboardCustomizeScreen, 'Dashboard Customize');
const SafeAssistant = withErrorBoundary(AssistantScreen, 'Assistant');
const SafeGlobalSearch = withErrorBoundary(GlobalSearchScreen, 'Search');
const SafeBillCalendar = withErrorBoundary(BillCalendarScreen, 'Bill Calendar');
const SafeAnnualReport = withErrorBoundary(AnnualReportScreen, 'Annual Report');
const SafeAccounts = withErrorBoundary(AccountsScreen, 'Accounts');
const SafeCrypto = withErrorBoundary(CryptoScreen, 'Crypto');
const SafeDebtPayoff = withErrorBoundary(DebtPayoffScreen, 'Debt Payoff');

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen
          name="AddExpense"
          component={SafeAddExpense}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="AddIncome"
          component={SafeAddIncome}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="BudgetDetail"
          component={SafeBudgetDetail}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Notifications"
          component={SafeNotifications}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Trends"
          component={SafeTrends}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="SavingsGoals"
          component={SafeSavingsGoals}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SafeSettings}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="DataTransfer"
          component={SafeDataTransfer}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="ReorderCategories"
          component={SafeReorderCategories}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="CategoryBudgets"
          component={SafeCategoryBudgets}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="DashboardCustomize"
          component={SafeDashboardCustomize}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="IncomeList"
          component={SafeIncomeList}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Assistant"
          component={SafeAssistant}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="GlobalSearch"
          component={SafeGlobalSearch}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="BillCalendar"
          component={SafeBillCalendar}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="AnnualReport"
          component={SafeAnnualReport}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Accounts"
          component={SafeAccounts}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Crypto"
          component={SafeCrypto}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="DebtPayoff"
          component={SafeDebtPayoff}
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
