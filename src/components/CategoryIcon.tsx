import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CATEGORY_ICONS, CATEGORY_COLORS, ExpenseCategory } from '../types';
import { BORDER_RADIUS } from '../constants/theme';
import { useExpenseStore } from '../store/useExpenseStore';

interface CategoryIconProps {
  category: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size = 40,
}) => {
  const customCategories = useExpenseStore((s) => s.customCategories);
  const custom = customCategories.find((c) => c.name === category);

  const color = custom?.color || CATEGORY_COLORS[category as ExpenseCategory] || '#AEB6BF';
  const iconName = custom?.icon || CATEGORY_ICONS[category as ExpenseCategory] || 'more-horiz';

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size * 0.3,
          backgroundColor: `${color}18`,
          borderColor: `${color}30`,
        },
      ]}
    >
      <MaterialIcons
        name={iconName as any}
        size={size * 0.5}
        color={color}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});
