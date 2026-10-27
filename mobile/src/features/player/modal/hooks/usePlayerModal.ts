import { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/theme/ThemeContext';
import { usePlayer } from '@/features/player/context/PlayerContext';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { usePlaybackControls } from '@/features/player/hooks/usePlaybackControls';
import { useImageColors } from '@/shared/hooks/useImageColors';
import { getAdaptiveColors, hexToRgba } from '@/shared/theme/adaptivePalette';
import { largeArtwork } from '@/shared/utils/artwork';
import { createStyles } from '@/features/player/modal/components/presenters/playerModalStyles';

export function usePlayerModal() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const { error } = usePlayer();
	const isModalOpen = usePlayerStore(state => state.isModalOpen);
	const setModalOpen = usePlayerStore(state => state.setModalOpen);
	const { nowPlaying, ...controls } = usePlaybackControls();

	const [isQueueOpen, setQueueOpen] = useState(false);
	const [isDevicesOpen, setDevicesOpen] = useState(false);
	const [wasModalOpen, setWasModalOpen] = useState(isModalOpen);

	if (wasModalOpen !== isModalOpen) {
		setWasModalOpen(isModalOpen);
		if (!isModalOpen) {
			setQueueOpen(false);
			setDevicesOpen(false);
		}
	}

	const artworkUrl = largeArtwork(nowPlaying.track?.artworkUrl);
	const { dominantColor } = useImageColors(artworkUrl, theme.colors.primary);
	const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

	const adaptive = useMemo(
		() => (dominantColor ? getAdaptiveColors(dominantColor, theme.colors.background) : null),
		[dominantColor, theme.colors.background]
	);

	const colors = useMemo(() => {
		const base = adaptive
			? {
					text: adaptive.text,
					textSecondary: adaptive.textSecondary,
					buttonBg: adaptive.buttonBg,
					slider: adaptive.accent,
					sliderBg: adaptive.accentBg,
					playBtnBg: adaptive.accent,
					playBtnIcon: adaptive.onAccent,
				}
			: {
					text: theme.colors.text,
					textSecondary: theme.colors.textSecondary,
					buttonBg: theme.colors.surface,
					slider: theme.colors.primary,
					sliderBg: theme.colors.border,
					playBtnBg: theme.colors.primary,
					playBtnIcon: theme.colors.onColor,
				};
		return {
			...base,
			error: theme.colors.error,
			errorBg: hexToRgba(theme.colors.error, 0.15),
		};
	}, [adaptive, theme]);

	const gradientColors: [string, string, string, string] = adaptive
		? adaptive.gradient
		: [
				theme.colors.background,
				theme.colors.background,
				theme.colors.background,
				theme.colors.background,
			];

	return {
		isModalOpen,
		closeModal: () => setModalOpen(false),
		isQueueOpen,
		setQueueOpen,
		isDevicesOpen,
		setDevicesOpen,
		styles,
		colors,
		gradientColors,
		track: nowPlaying.track,
		artworkUrl,
		error,
		isRemote: nowPlaying.isRemote,
		isPlaying: nowPlaying.isPlaying,
		isLoading: nowPlaying.isLoading,
		deviceLabel: nowPlaying.deviceLabel,
		...controls,
	};
}
