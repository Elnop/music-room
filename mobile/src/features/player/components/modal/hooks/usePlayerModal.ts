import { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/theme/ThemeContext';
import { usePlayer } from '@/features/player/context/PlayerContext';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { useNowPlaying } from '@/features/player/hooks/useNowPlaying';
import { useImageColors } from '@/shared/hooks/useImageColors';
import { getAdaptiveColors, hexToRgba } from '@/shared/theme/adaptivePalette';
import { largeArtwork } from '@/shared/utils/artwork';
import { hapticTap } from '@/shared/utils/haptics';
import { RESTART_THRESHOLD_S } from '@/store/queueSelectors';
import {
	createStyles,
	SEEK_STEP_S,
} from '@/features/player/components/modal/components/presenters/playerModalStyles';

export function usePlayerModal() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const { player, error, seekTo } = usePlayer();
	const isModalOpen = usePlayerStore(state => state.isModalOpen);
	const setModalOpen = usePlayerStore(state => state.setModalOpen);
	const nowPlaying = useNowPlaying();

	const currentTime = nowPlaying.positionMs / 1000;
	const duration = nowPlaying.durationMs !== null ? nowPlaying.durationMs / 1000 : null;

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
		: [theme.colors.background, theme.colors.background, theme.colors.background, theme.colors.background];

	const handlePlayPause = () => {
		if (!nowPlaying.canToggle) return;
		hapticTap();
		nowPlaying.toggle();
	};

	const handleSeek = (value: number) => {
		if (!player || nowPlaying.isRemote) return;
		seekTo(value);
	};

	const handleSliderAction = (actionName: string) => {
		if (duration === null) return;
		const step = actionName === 'increment' ? SEEK_STEP_S : actionName === 'decrement' ? -SEEK_STEP_S : 0;
		if (step === 0) return;
		handleSeek(Math.min(duration, Math.max(0, currentTime + step)));
	};

	const canGoPrevious =
		nowPlaying.canToggle && (nowPlaying.hasPrevious || (!nowPlaying.isRemote && currentTime > RESTART_THRESHOLD_S));
	const canGoNext = nowPlaying.track !== null && nowPlaying.hasNext;

	const handlePrevious = () => {
		if (!canGoPrevious) return;
		hapticTap();
		nowPlaying.previous();
	};

	const handleNext = () => {
		if (!canGoNext) return;
		hapticTap();
		nowPlaying.next();
	};

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
		currentTime,
		duration,
		sliderDisabled: nowPlaying.isRemote || nowPlaying.isLoading || !player || !nowPlaying.track,
		isPlaying: nowPlaying.isPlaying,
		isLoading: nowPlaying.isLoading,
		deviceLabel: nowPlaying.deviceLabel,
		canGoPrevious,
		canGoNext,
		playDisabled: nowPlaying.isLoading || !nowPlaying.track,
		handlePlayPause,
		handleSeek,
		handleSliderAction,
		handlePrevious,
		handleNext,
	};
}
