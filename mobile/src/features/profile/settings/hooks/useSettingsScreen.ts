import { useBottomPadding } from '@/shared/hooks/useBottomPadding';
import { useTheme } from '@/shared/theme/ThemeContext';

export function useSettingsScreen() {
	const { theme } = useTheme();
	const bottomPadding = useBottomPadding();

	return { theme, bottomPadding };
}
