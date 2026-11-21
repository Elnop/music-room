import { usePlayerProgress } from '@/features/playback/shared/player/hooks/usePlayerProgress';
import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';

type LocalTiming = Pick<NowPlaying, 'positionMs' | 'durationMs'>;

export function useLocalTiming(currentTrack: SoundCloudTrack | null): LocalTiming {
	const { currentTime, duration } = usePlayerProgress();
	const needsStreamLoad = usePlayerState(state => state.needsStreamLoad);
	const restoredPositionMs = usePlayerState(state => state.startPositionMs ?? 0);

	return {
		positionMs: needsStreamLoad ? restoredPositionMs : currentTime * 1000,
		durationMs: needsStreamLoad && currentTrack ? currentTrack.duration : duration * 1000,
	};
}
