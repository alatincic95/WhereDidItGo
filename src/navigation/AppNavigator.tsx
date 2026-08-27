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
import { useTheme } from '../contexts/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpenseListScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="receipt-long" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Income"
        component={IncomeListScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="account-balance" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Budgets"
        component={ProjectsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="account-balance-wallet" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Fixed"
        component={FixedExpensesScreen}
        options={{
          tabBarLabel: 'Recurring',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="autorenew" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen
          name="AddExpense"
          component={AddExpenseScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="AddIncome"
          component={AddIncomeScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="BudgetDetail"
          component={ProjectDetailScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Trends"
          component={TrendsScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="SavingsGoals"
          component={SavingsGoalsScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="DataTransfer"
          component={DataTransferScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="ReorderCategories"
          component={ReorderCategoriesScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="CategoryBudgets"
          component={CategoryBudgetsScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="DashboardCustomize"
          component={DashboardCustomizeScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="IncomeList"
          component={IncomeListScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Assistant"
          component={AssistantScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
