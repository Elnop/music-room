import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useTheme } from '@/shared/theme/ThemeContext';

export function useSeparatorColor(): string {
	const { theme } = useTheme();
	const { isWide } = useBreakpoint();
	return isWide ? theme.colors.borderSubtle : theme.colors.border;
}
