import { useTheme } from '@/shared/theme/hooks/useTheme';

export function useBottomPadding(): number {
	const { theme } = useTheme();
	return theme.spacing.xl;
}
