import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { useTheme } from '@/shared/theme/components/ThemeContext';

export function useSeparatorColor(): string {
	const { theme } = useTheme();
	const { isWide } = useBreakpoint();
	return isWide ? theme.colors.borderSubtle : theme.colors.border;
}
