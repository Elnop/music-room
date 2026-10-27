import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useTheme } from '@/shared/theme/ThemeContext';

/** The phone keeps its white separators; across a wide screen they would draw long white lines. */
export function useSeparatorColor(): string {
	const { theme } = useTheme();
	const { isWide } = useBreakpoint();
	return isWide ? theme.colors.borderSubtle : theme.colors.border;
}
