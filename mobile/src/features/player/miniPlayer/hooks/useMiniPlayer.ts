import type { LayoutChangeEvent } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { useMiniPlayerLayoutStore } from '@/features/player/stores/miniPlayerLayoutStore';
import { useNowPlaying, type NowPlayingTrack } from '@/features/player/hooks/useNowPlaying';
import { RESTART_THRESHOLD_S } from '@/shared/utils/queueNavigation';
import { hapticTap } from '@/shared/utils/haptics';
import { SWIPE_FLICK_VELOCITY, trackSwipeDirection } from '@/features/player/utils/trackSwipe';

const SWIPE_OPEN_THRESHOLD = 40;

export interface MiniPlayerData {
	track: NowPlayingTrack | null;
	deviceLabel: string | null;
	isPlaying: boolean;
	isLoading: boolean;
	playDisabled: boolean;
	nextDisabled: boolean;
	progress: number;
	openLabel: string;
	onToggleModal: () => void;
	onTogglePlay: () => void;
	onNext: () => void;
	infoStyle: ReturnType<typeof useAnimatedStyle>;
	panGesture: ReturnType<typeof Gesture.Pan>;
	onLayout: (event: LayoutChangeEvent) => void;
}

export function useMiniPlayer(): MiniPlayerData {
	const toggleModal = usePlayerStore(state => state.toggleModal);
	const setModalOpen = usePlayerStore(state => state.setModalOpen);
	const setHeight = useMiniPlayerLayoutStore(state => state.setHeight);
	const {
		isRemote,
		track,
		isPlaying,
		isLoading,
		canToggle,
		positionMs,
		durationMs,
		deviceLabel,
		toggle,
		next,
		previous,
		hasNext,
		hasPrevious,
	} = useNowPlaying();

	const progress = track && durationMs ? Math.min(100, (positionMs / durationMs) * 100) : 0;
	const canGoNext = track !== null && hasNext;
	const canGoPrevious =
		canToggle && (hasPrevious || (!isRemote && positionMs / 1000 > RESTART_THRESHOLD_S));

	const handleToggle = () => {
		if (!canToggle) return;
		hapticTap();
		toggle();
	};

	const handleNext = () => {
		if (!canGoNext) return;
		hapticTap();
		next();
	};

	const handlePrevious = () => {
		if (!canGoPrevious) return;
		hapticTap();
		previous();
	};

	const translateX = useSharedValue(0);
	const panGesture = Gesture.Pan()
		.withTestId('mini-player-pan')
		.activeOffsetX([-15, 15])
		.activeOffsetY(-15)
		.onUpdate(event => {
			translateX.value =
				Math.abs(event.translationX) > Math.abs(event.translationY) ? event.translationX : 0;
		})
		.onEnd(event => {
			const horizontal = Math.abs(event.translationX) > Math.abs(event.translationY);
			const direction = trackSwipeDirection(event);
			const up =
				event.translationY < -SWIPE_OPEN_THRESHOLD || event.velocityY < -SWIPE_FLICK_VELOCITY;
			if (direction === 'next' && canGoNext) {
				runOnJS(handleNext)();
			} else if (direction === 'previous' && canGoPrevious) {
				runOnJS(handlePrevious)();
			} else if (!horizontal && up) {
				runOnJS(setModalOpen)(true);
			}
			translateX.value = withSpring(0);
		});

	const infoStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
	}));

	const openLabel = [
		'Ouvrir le lecteur',
		...(track ? [track.title, track.artist] : ['Rien en lecture']),
		...(deviceLabel ? [`sur ${deviceLabel}`] : []),
	].join(', ');

	return {
		track,
		deviceLabel,
		isPlaying,
		isLoading,
		playDisabled: isLoading || !track,
		nextDisabled: !canGoNext,
		progress,
		openLabel,
		onToggleModal: toggleModal,
		onTogglePlay: handleToggle,
		onNext: handleNext,
		infoStyle,
		panGesture,
		onLayout: event => setHeight(event.nativeEvent.layout.height),
	};
}
