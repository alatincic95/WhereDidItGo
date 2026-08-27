import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';

interface DashboardFABProps {
  fabOpen: boolean;
  setFabOpen: (open: boolean) => void;
  navigation: any;
}

export const DashboardFAB: React.FC<DashboardFABProps> = ({ fabOpen, setFabOpen, navigation }) => {
  const { colors } = useTheme();
  return (
    <>
      {fabOpen && (
        <>
          <TouchableOpacity
            style={styles.fabOverlay}
            activeOpacity={1}
            onPress={() => setFabOpen(false)}
          />
          <TouchableOpacity
            style={[styles.fabOption, { bottom: 270 }]}
            activeOpacity={0.85}
            onPress={() => { setFabOpen(false); navigation.navigate('Assistant'); }}
          >
            <View style={[styles.fabOptionLabel, { backgroundColor: colors.surface }]}>
              <Text style={[styles.fabOptionLabelText, { color: colors.textPrimary }]}>Assistant</Text>
            </View>
            <LinearGradient colors={['#00BCD4', '#6C63FF']} style={styles.fabOptionGradient}>
              <MaterialIcons name="smart-toy" size={22} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fabOption, { bottom: 216 }]}
            activeOpacity={0.85}
            onPress={() => { setFabOpen(false); navigation.navigate('AddIncome'); }}
          >
            <View style={[styles.fabOptionLabel, { backgroundColor: colors.surface }]}>
              <Text style={[styles.fabOptionLabelText, { color: colors.textPrimary }]}>Income</Text>
            </View>
            <LinearGradient colors={['#00D68F', '#45B7D1']} style={styles.fabOptionGradient}>
              <MaterialIcons name="add" size={22} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fabOption, { bottom: 162 }]}
            activeOpacity={0.85}
            onPress={() => { setFabOpen(false); navigation.navigate('AddExpense'); }}
          >
            <View style={[styles.fabOptionLabel, { backgroundColor: colors.surface }]}>
              <Text style={[styles.fabOptionLabelText, { color: colors.textPrimary }]}>Expense</Text>
            </View>
            <LinearGradient colors={['#FF6B9D', '#FF8E53']} style={styles.fabOptionGradient}>
              <MaterialIcons name="remove" size={22} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setFabOpen(!fabOpen)}
      >
        <LinearGradient colors={['#6C63FF', '#BB8FCE']} style={styles.fabGradient}>
          <MaterialIcons name={fabOpen ? 'close' : 'add'} size={28} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 96,
    right: SPACING.lg,
    zIndex: 101,
    borderRadius: 29,
  },
  fabGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  fabOption: {
    position: 'absolute',
    right: SPACING.lg,
    zIndex: 101,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  fabOptionLabel: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
  },
  fabOptionLabelText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  fabOptionGradient: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
