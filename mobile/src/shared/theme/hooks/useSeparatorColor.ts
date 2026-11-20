import { useBreakpoint } from './useBreakpoint';
import { useTheme } from '@/shared/theme/components/ThemeContext';

/** Across a wide screen, the phone's white separators would draw long white lines. */
export function useSeparatorColor(): string {
	const { theme } = useTheme();
	const { isWide } = useBreakpoint();
	return isWide ? theme.colors.borderSubtle : theme.colors.border;
}
