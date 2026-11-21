import { usePlayer } from '@/features/playback/shared/player/hooks/usePlayer';
import { useNowPlaying } from '@/features/playback/shared/player/hooks/useNowPlaying';
import { seekControls } from '@/features/playback/shared/player/lib/seekControls';
import { transportControls } from '@/features/playback/shared/player/lib/transportControls';

export function usePlaybackControls() {
	const { player, seekTo } = usePlayer();
	const nowPlaying = useNowPlaying();
	const currentTime = nowPlaying.positionMs / 1000;
	const duration = nowPlaying.durationMs !== null ? nowPlaying.durationMs / 1000 : null;

	return {
		nowPlaying,
		currentTime,
		duration,
		playDisabled: nowPlaying.isLoading || !nowPlaying.track,
		...transportControls(nowPlaying, currentTime),
		...seekControls({ player, seekTo, nowPlaying, currentTime, duration }),
	};
}
