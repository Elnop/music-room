import { SEEK_STEP_S } from '@/features/playback/shared/player/configs/playerConfig';
import type { AudioPlayer, NowPlaying } from '@/features/playback/shared/player/types/playerTypes';

type SeekContext = {
	player: AudioPlayer;
	seekTo: (seconds: number) => void;
	nowPlaying: NowPlaying;
	currentTime: number;
	duration: number | null;
};

function sliderStep(actionName: string): number {
	if (actionName === 'increment') return SEEK_STEP_S;
	if (actionName === 'decrement') return -SEEK_STEP_S;
	return 0;
}

export function seekControls({ player, seekTo, nowPlaying, currentTime, duration }: SeekContext) {
	function handleSeek(value: number) {
		if (!player || nowPlaying.isRemote) return;
		seekTo(value);
	}
	return {
		sliderDisabled: nowPlaying.isRemote || nowPlaying.isLoading || !player || !nowPlaying.track,
		handleSeek,
		handleSliderAction: (actionName: string) => {
			const step = sliderStep(actionName);
			if (duration === null || step === 0) return;
			handleSeek(Math.min(duration, Math.max(0, currentTime + step)));
		},
	};
}
