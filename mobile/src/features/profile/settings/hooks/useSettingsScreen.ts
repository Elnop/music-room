import { usePlayerHeight } from '@/shared/services/playbackBridge';
import { useTheme } from '@/shared/theme/ThemeContext';

export function useSettingsScreen() {
	const { theme } = useTheme();
	const playerHeight = usePlayerHeight();

	return { theme, playerHeight };
}
