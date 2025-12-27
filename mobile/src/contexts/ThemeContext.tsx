import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { royalBlueTheme } from '@themes/royalBlue.theme';
import { christmasTheme } from '@themes/christmas.theme';
import { pastelLimeTheme } from '@themes/pastelLime.theme';
import { originalTheme } from '@themes/original.theme';
import type { ThemeName, ThemeContextValue } from '@/themes/types';
import type { Theme } from '@/themes/types';

const THEME_STORAGE_KEY = '@musicroom/theme_preference';

const THEMES: Record<ThemeName, Theme> = {
  royalBlue: royalBlueTheme,
  christmas: christmasTheme,
  pastelLime: pastelLimeTheme,
  original: originalTheme,
};

if (__DEV__)
  console.log('🔵 [ThemeContext] Themes initialized:', {
    royalBlue: {
      hasSpacing: !!royalBlueTheme.spacing,
      spacingKeys: royalBlueTheme.spacing ? Object.keys(royalBlueTheme.spacing) : [],
    },
    christmas: {
      hasSpacing: !!christmasTheme.spacing,
      spacingKeys: christmasTheme.spacing ? Object.keys(christmasTheme.spacing) : [],
    },
    pastelLime: {
      hasSpacing: !!pastelLimeTheme.spacing,
      spacingKeys: pastelLimeTheme.spacing ? Object.keys(pastelLimeTheme.spacing) : [],
    },
  });

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>('royalBlue');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isLoaded) return;

    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && savedTheme in THEMES) {
          setThemeName(savedTheme as ThemeName);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    void loadTheme();
  }, [isLoaded, setThemeName, setIsLoaded]);

  const setTheme = async (name: ThemeName) => {
    try {
      setThemeName(name);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, name);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const theme = THEMES[themeName];

  React.useEffect(() => {
    if (__DEV__)
      console.log('🔵 [ThemeContext] Active theme:', {
        themeName,
        hasTheme: !!theme,
        hasSpacing: !!theme?.spacing,
        spacingKeys: theme?.spacing ? Object.keys(theme.spacing) : [],
        spacingSm: theme?.spacing?.sm,
      });
  }, [themeName, theme]);

  const value: ThemeContextValue = {
    theme,
    themeName,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
