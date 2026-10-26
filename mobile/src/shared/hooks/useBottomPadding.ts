import { useTheme } from '@/shared/theme/ThemeContext';

/** The mini-player belongs to the tab bar, so screens end above it: this is only breathing room. */
export function useBottomPadding(): number {
	const { theme } = useTheme();
	return theme.spacing.xl;
}
