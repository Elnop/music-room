import { isLocalTarget } from '@/features/playback/lib/isLocalTarget';
import { isStreamStale } from '@/features/playback/lib/streamPrefetch';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import type { AudioPlayer } from '@/features/playback/shared/player/types/playerTypes';
import type { PlaybackState } from '@/shared/playback/types/playbackTypes';

export function syncPlayback(player: AudioPlayer, playbackState: PlaybackState): void {
	if (!player || !player.isLoaded) return;
	if (playbackState === 'playing' && !player.playing) {
		const { streamExpiresAt, renewStream } = playerStore.getState();
		if (isStreamStale(streamExpiresAt) && isLocalTarget()) {
			renewStream(player.currentTime * 1000, true);
			return;
		}
		player.play();
	} else if (playbackState === 'paused' && player.playing) {
		player.pause();
	}
}
