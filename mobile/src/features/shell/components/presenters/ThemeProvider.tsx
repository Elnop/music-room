import React from 'react';
import { originalTheme } from '@/shared/theme/configs/originalThemeConfig';
import { ThemeContext } from '@/shared/theme/configs/themeContextConfig';
import type { ThemeContextValue } from '@/shared/theme/types/themeTypes';

const VALUE: ThemeContextValue = { theme: originalTheme };

type ThemeProviderProps = {
	children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
	return <ThemeContext.Provider value={VALUE}>{children}</ThemeContext.Provider>;
}
