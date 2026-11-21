import { createContext } from 'react';
import type { ThemeContextValue } from '@/shared/theme/types/themeTypes';

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
