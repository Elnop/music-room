import { useTheme } from '@/shared/theme/ThemeContext';

export function useBottomPadding(): number {
	const { theme } = useTheme();
	return theme.spacing.xl;
}
