import { useNowPlaying } from '@/features/playback/shared/player/hooks/useNowPlaying';
import { RESTART_THRESHOLD_S } from '@/features/playback/shared/player/configs/playerConfig';
import { hapticTap } from '@/shared/theme/lib/haptics';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';
import type { MiniPlayerControls } from '@/features/playback/features/mini-player/miniPlayerTypes';

function canStepBack(nowPlaying: NowPlaying): boolean {
	const restarts = !nowPlaying.isRemote && nowPlaying.positionMs / 1000 > RESTART_THRESHOLD_S;
	return nowPlaying.canToggle && (nowPlaying.hasPrevious || restarts);
}

function tapWhen(allowed: boolean, action: () => void): void {
	if (!allowed) return;
	hapticTap();
	action();
}

export function useMiniPlayerControls(): MiniPlayerControls {
	const nowPlaying = useNowPlaying();
	const canGoNext = nowPlaying.track !== null && nowPlaying.hasNext;
	const canGoPrevious = canStepBack(nowPlaying);
	return {
		nowPlaying,
		canGoNext,
		canGoPrevious,
		onTogglePlay: () => tapWhen(nowPlaying.canToggle, nowPlaying.toggle),
		onNext: () => tapWhen(canGoNext, nowPlaying.next),
		onPrevious: () => tapWhen(canGoPrevious, nowPlaying.previous),
	};
}
