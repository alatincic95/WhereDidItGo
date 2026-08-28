import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import { useExpenseStore } from '../store/useExpenseStore';
import { DARK_COLORS, LIGHT_COLORS, ColorPalette, ThemeMode } from '../constants/theme';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ColorPalette;
  isDark: boolean;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  colors: DARK_COLORS,
  isDark: true,
  toggle: () => {},
  setMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const themeMode = useExpenseStore((s) => s.themeMode);
  const setThemeMode = useExpenseStore((s) => s.setThemeMode);
  const [systemScheme, setSystemScheme] = useState<'dark' | 'light'>(
    Appearance.getColorScheme() === 'light' ? 'light' : 'dark'
  );

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'light' ? 'light' : 'dark');
    });
    return () => sub.remove();
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const resolved = themeMode === 'system' ? systemScheme : themeMode;
    const isDark = resolved === 'dark';
    return {
      mode: themeMode,
      colors: isDark ? DARK_COLORS : LIGHT_COLORS,
      isDark,
      toggle: () => setThemeMode(themeMode === 'dark' ? 'light' : 'dark'),
      setMode: (mode: ThemeMode) => setThemeMode(mode),
    };
  }, [themeMode, systemScheme, setThemeMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
