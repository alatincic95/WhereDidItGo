import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { ViewMode } from './helpers';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ viewMode, setViewMode }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.toggleWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        style={[styles.toggleBtn, viewMode === 'monthly' && styles.toggleBtnActive]}
        onPress={() => setViewMode('monthly')}
      >
        {viewMode === 'monthly' ? (
          <LinearGradient
            colors={['#6C63FF', '#9B59B6']}
            style={styles.toggleGradient}
          >
            <MaterialIcons name="calendar-today" size={16} color="#FFF" />
            <Text style={styles.toggleTextActive}>Monthly</Text>
          </LinearGradient>
        ) : (
          <>
            <MaterialIcons name="calendar-today" size={16} color={colors.textMuted} />
            <Text style={[styles.toggleText, { color: colors.textMuted }]}>Monthly</Text>
          </>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleBtn, viewMode === 'overall' && styles.toggleBtnActive]}
        onPress={() => setViewMode('overall')}
      >
        {viewMode === 'overall' ? (
          <LinearGradient
            colors={['#00D68F', '#45B7D1']}
            style={styles.toggleGradient}
          >
            <MaterialIcons name="account-balance" size={16} color="#FFF" />
            <Text style={styles.toggleTextActive}>Overall</Text>
          </LinearGradient>
        ) : (
          <>
            <MaterialIcons name="account-balance" size={16} color={colors.textMuted} />
            <Text style={[styles.toggleText, { color: colors.textMuted }]}>Overall</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.round,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.round,
    gap: 6,
  },
  toggleBtnActive: {
    overflow: 'hidden',
  },
  toggleGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.round,
    gap: 6,
    width: '100%',
  },
  toggleText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  toggleTextActive: {
    fontSize: FONT_SIZE.md,
    color: '#FFF',
    fontWeight: '700',
  },
});
