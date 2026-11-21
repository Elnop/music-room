import { hexToRgba, useImageColors } from '@/shared/image-colors/useImageColors';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { GradientColors } from '@/features/playlists/features/editor/features/detail/types/detailPageTypes';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/playlistTypes';

export function useCoverGradient(playlist: PlaylistWithTracks | undefined): GradientColors {
	const { theme } = useTheme();
	const coverUrl = playlist?.coverUrl || playlist?.tracks[0]?.albumArt;
	const { dominantColor } = useImageColors(coverUrl, theme.colors.primary);
	const background = theme.colors.background;
	return dominantColor
		? [
				hexToRgba(dominantColor, 0.9),
				hexToRgba(dominantColor, 0.6),
				hexToRgba(dominantColor, 0.3),
				background,
			]
		: [background, background, background, background];
}
