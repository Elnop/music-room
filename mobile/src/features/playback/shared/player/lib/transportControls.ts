import { hapticTap } from '@/shared/theme/lib/haptics';
import { RESTART_THRESHOLD_S } from '@/features/playback/shared/player/configs/playerConfig';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';

export function transportControls(nowPlaying: NowPlaying, currentTime: number) {
	const canGoPrevious =
		nowPlaying.canToggle &&
		(nowPlaying.hasPrevious || (!nowPlaying.isRemote && currentTime > RESTART_THRESHOLD_S));
	const canGoNext = nowPlaying.track !== null && nowPlaying.hasNext;
	return {
		canGoPrevious,
		canGoNext,
		handlePlayPause: () => {
			if (!nowPlaying.canToggle) return;
			hapticTap();
			nowPlaying.toggle();
		},
		handlePrevious: () => {
			if (!canGoPrevious) return;
			hapticTap();
			nowPlaying.previous();
		},
		handleNext: () => {
			if (!canGoNext) return;
			hapticTap();
			nowPlaying.next();
		},
	};
}
