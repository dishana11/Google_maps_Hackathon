import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance } from 'react-native';
import { LightColors, DarkColors } from '../constants/Colors';
import { StorageService } from '../services/StorageService';

type Theme = 'light' | 'dark' | 'system';
type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  colors: typeof LightColors;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    updateColorScheme();
  }, [theme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await StorageService.getTheme();
      setThemeState(savedTheme);
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const updateColorScheme = () => {
    if (theme === 'system') {
      // Check if we're in a web environment and window.matchMedia is available
      if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setColorScheme(systemPrefersDark ? 'dark' : 'light');
      } else {
        // Use React Native's Appearance API for non-web platforms
        const systemColorScheme = Appearance.getColorScheme();
        setColorScheme(systemColorScheme === 'dark' ? 'dark' : 'light');
      }
    } else {
      setColorScheme(theme as ColorScheme);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    await StorageService.saveTheme(newTheme);
  };

  const colors = colorScheme === 'dark' ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
