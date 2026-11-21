import React, { createContext, useContext } from 'react';
import { originalTheme } from '@/shared/theme/lib/original.theme';
import type { ThemeContextValue } from '@/shared/theme/lib/types';

const VALUE: ThemeContextValue = { theme: originalTheme };

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type ThemeProviderProps = {
	children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
	return <ThemeContext.Provider value={VALUE}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useTheme must be used within ThemeProvider');
	}
	return context;
}
