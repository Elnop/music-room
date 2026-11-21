import { useMemo } from 'react';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { useImageColors } from '@/shared/image-colors/useImageColors';
import { getAdaptiveColors } from '@/shared/image-colors/lib/adaptivePalette';
import {
	playerColors,
	playerGradient,
} from '@/features/playback/features/player-modal/lib/playerColors';
import { useColorFade } from '@/features/playback/features/player-modal/hooks/useColorFade';

export function usePlayerColors(artworkUrl: string | null) {
	const { theme } = useTheme();
	const { dominantColor } = useImageColors(artworkUrl, theme.colors.primary);
	const adaptive = useMemo(
		() => (dominantColor ? getAdaptiveColors(dominantColor, theme.colors.background) : null),
		[dominantColor, theme.colors.background]
	);
	const colors = useMemo(() => playerColors(theme, adaptive), [adaptive, theme]);
	const backgroundStyle = useColorFade(playerGradient(theme, adaptive)[0]);
	return { colors, backgroundStyle };
}
