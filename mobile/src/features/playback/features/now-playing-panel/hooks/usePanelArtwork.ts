import { useMemo } from 'react';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { hexToRgba, useImageColors } from '@/shared/image-colors/useImageColors';
import { largeArtwork } from '@/features/playback/shared/artwork/largeArtwork';
import type { NowPlayingTrack } from '@/features/playback/shared/player/types/playerTypes';
import type { PanelArtwork } from '@/features/playback/features/now-playing-panel/nowPlayingPanelTypes';

export function usePanelArtwork(track: NowPlayingTrack | null): PanelArtwork {
	const { theme } = useTheme();
	const artworkUrl = largeArtwork(track?.artworkUrl);
	const { dominantColor } = useImageColors(artworkUrl, theme.colors.primary);
	const gradient = useMemo<readonly [string, string]>(
		() =>
			dominantColor
				? [hexToRgba(dominantColor, 0.22), 'transparent']
				: ['transparent', 'transparent'],
		[dominantColor],
	);
	return { artworkUrl, gradient };
}
