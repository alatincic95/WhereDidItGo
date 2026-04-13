import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useExpenseStore } from '../store/useExpenseStore';
import { useTheme } from '../contexts/ThemeContext';
import { CategoryIcon } from '../components/CategoryIcon';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../constants/theme';

export const ReorderCategoriesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { getOrderedCategories, setCategoryOrder } = useExpenseStore();

  const [order, setOrder] = useState<string[]>(getOrderedCategories());

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setOrder((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  const handleSave = () => {
    setCategoryOrder(order);
    navigation.goBack();
  };

  const handleReset = () => {
    setOrder(getOrderedCategories());
    setCategoryOrder([]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Reorder Categories</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveText, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Move categories up or down to set the order they appear in filters and expense forms.
      </Text>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {order.map((name, index) => (
          <View
            key={name}
            style={[
              styles.item,
              {
                backgroundColor: isDark ? 'rgba(22, 33, 62, 0.6)' : colors.surface,
                borderColor: isDark ? 'rgba(108, 99, 255, 0.06)' : colors.border,
              },
            ]}
          >
            <View style={styles.itemLeft}>
              <Text style={[styles.rank, { color: colors.textMuted }]}>{index + 1}</Text>
              <CategoryIcon category={name} size={40} />
              <Text style={[styles.itemName, { color: colors.textPrimary }]}>{name}</Text>
            </View>
            <View style={styles.arrows}>
              <TouchableOpacity
                onPress={() => moveUp(index)}
                disabled={index === 0}
                style={[
                  styles.arrowBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  index === 0 && styles.arrowDisabled,
                ]}
              >
                <MaterialIcons
                  name="keyboard-arrow-up"
                  size={22}
                  color={index === 0 ? colors.textMuted : colors.textPrimary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => moveDown(index)}
                disabled={index === order.length - 1}
                style={[
                  styles.arrowBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  index === order.length - 1 && styles.arrowDisabled,
                ]}
              >
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={22}
                  color={index === order.length - 1 ? colors.textMuted : colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <MaterialIcons name="restart-alt" size={18} color={colors.textMuted} />
          <Text style={[styles.resetText, { color: colors.textMuted }]}>Reset to Default Order</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  saveText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  list: {
    paddingHorizontal: SPACING.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  rank: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
  },
  itemName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  arrows: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  arrowDisabled: {
    opacity: 0.3,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.md,
  },
  resetText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
});
