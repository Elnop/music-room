import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import type { Theme as NavigationTheme } from '@react-navigation/native';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { NAVIGATION_FONTS } from '@/features/shell/lib/navigationFonts';
import { isDarkBackground } from '@/features/shell/lib/textContrast';

export function navigationThemeFor(theme: Theme): NavigationTheme {
	const base = isDarkBackground(theme.colors.background) ? DarkTheme : DefaultTheme;
	return {
		...base,
		fonts: NAVIGATION_FONTS,
		colors: {
			...base.colors,
			primary: theme.colors.primary,
			background: theme.colors.background,
			card: theme.colors.background,
			text: theme.colors.text,
			border: theme.colors.borderLight,
			notification: theme.colors.primary,
		},
	};
}
