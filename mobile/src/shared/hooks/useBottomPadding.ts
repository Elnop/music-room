import { useTheme } from '@/shared/theme/ThemeContext';
import { usePlayerHeight } from '@/shared/services/playbackBridge';

/** The `paddingBottom` a scrolling screen needs for its last item to clear the mini-player. */
export function useBottomPadding(): number {
	const { theme } = useTheme();
	return usePlayerHeight() + theme.spacing.xl;
}
