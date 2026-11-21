import { useTheme } from '@/shared/theme/components/ThemeContext';

export function useBottomPadding(): number {
	const { theme } = useTheme();
	return theme.spacing.xl;
}
