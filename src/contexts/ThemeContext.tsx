import React, { createContext, useContext, useMemo } from 'react';
import { useExpenseStore } from '../store/useExpenseStore';
import { DARK_COLORS, LIGHT_COLORS, ColorPalette, ThemeMode } from '../constants/theme';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ColorPalette;
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  colors: DARK_COLORS,
  isDark: true,
  toggle: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const themeMode = useExpenseStore((s) => s.themeMode);
  const setThemeMode = useExpenseStore((s) => s.setThemeMode);

  const value = useMemo<ThemeContextValue>(() => ({
    mode: themeMode,
    colors: themeMode === 'dark' ? DARK_COLORS : LIGHT_COLORS,
    isDark: themeMode === 'dark',
    toggle: () => setThemeMode(themeMode === 'dark' ? 'light' : 'dark'),
  }), [themeMode, setThemeMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
