import React, { useEffect, useRef } from 'react';
import { Animated, Text, TextStyle } from 'react-native';

interface AnimatedNumberProps {
  value: number;
  style?: TextStyle;
  prefix?: string;
  duration?: number;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  style,
  prefix = '$',
  duration = 800,
}) => {
  // For simplicity, just display the formatted number
  // Real animation would use useNativeDriver with reanimated
  const formatted = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const sign = value < 0 ? '-' : '';

  return (
    <Text style={style}>
      {sign}{prefix}{formatted}
    </Text>
  );
};
