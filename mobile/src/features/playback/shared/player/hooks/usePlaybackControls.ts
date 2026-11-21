import { usePlayer } from '@/features/playback/shared/player/lib/PlayerContext';
import { useNowPlaying } from '@/features/playback/shared/player/hooks/useNowPlaying';
import { SEEK_STEP_S } from '@/features/playback/shared/player/lib/constants';
import { hapticTap } from '@/shared/theme/lib/haptics';
import { RESTART_THRESHOLD_S } from '@/features/playback/shared/player/lib/queueNavigation';

export function usePlaybackControls() {
	const { player, seekTo } = usePlayer();
	const nowPlaying = useNowPlaying();

	const currentTime = nowPlaying.positionMs / 1000;
	const duration = nowPlaying.durationMs !== null ? nowPlaying.durationMs / 1000 : null;

	function handlePlayPause() {
		if (!nowPlaying.canToggle) return;
		hapticTap();
		nowPlaying.toggle();
	}

	function handleSeek(value: number) {
		if (!player || nowPlaying.isRemote) return;
		seekTo(value);
	}

	function handleSliderAction(actionName: string) {
		if (duration === null) return;
		const step =
			actionName === 'increment' ? SEEK_STEP_S : actionName === 'decrement' ? -SEEK_STEP_S : 0;
		if (step === 0) return;
		handleSeek(Math.min(duration, Math.max(0, currentTime + step)));
	}

	const canGoPrevious =
		nowPlaying.canToggle &&
		(nowPlaying.hasPrevious || (!nowPlaying.isRemote && currentTime > RESTART_THRESHOLD_S));
	const canGoNext = nowPlaying.track !== null && nowPlaying.hasNext;

	function handlePrevious() {
		if (!canGoPrevious) return;
		hapticTap();
		nowPlaying.previous();
	}

	function handleNext() {
		if (!canGoNext) return;
		hapticTap();
		nowPlaying.next();
	}

	return {
		nowPlaying,
		currentTime,
		duration,
		sliderDisabled: nowPlaying.isRemote || nowPlaying.isLoading || !player || !nowPlaying.track,
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
