import { useContext } from 'react';
import { ThemeContext } from '@/shared/theme/configs/themeContextConfig';

export function useTheme() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useTheme must be used within ThemeProvider');
	}
	return context;
}
