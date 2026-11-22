import { usePlayer } from '@/features/playback/shared/player/hooks/usePlayer';
import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';

type PlaybackStatus = Pick<NowPlaying, 'isPlaying' | 'isLoading' | 'canToggle' | 'toggle'>;

export function usePlaybackStatus(currentTrack: SoundCloudTrack | null): PlaybackStatus {
	const { player } = usePlayer();
	const playbackState = usePlayerState((state) => state.playbackState);
	const isPlaying = playbackState === 'playing';
	const canToggle = Boolean(currentTrack) && (isPlaying || playbackState === 'paused');

	return {
		isPlaying,
		isLoading: playbackState === 'loading',
		canToggle,
		toggle: () => {
			if (!canToggle || !player) return;
			const { pause, resume } = playerStore.getState();
			if (isPlaying) pause();
			else resume();
		},
	};
}
