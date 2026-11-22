import { isLocalTarget } from '@/features/playback/lib/isLocalTarget';
import { isStreamStale } from '@/features/playback/lib/streamPrefetch';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import type { AudioPlayer } from '@/features/playback/shared/player/types/playerTypes';

export function playerPositionMs(player: AudioPlayer): number {
	const { playbackState, startPositionMs, needsStreamLoad } = playerStore.getState();
	if (needsStreamLoad) return startPositionMs ?? 0;
	if (playbackState === 'loading' && startPositionMs !== null) return startPositionMs;
	return player.currentTime * 1000;
}

export function seekPlayer(player: AudioPlayer, seconds: number): void {
	if (!player) return;
	const state = playerStore.getState();
	if (state.needsStreamLoad) {
		state.setRestoredPosition(seconds * 1000);
		state.markSeek();
		return;
	}
	const canRenew = state.playbackState === 'playing' || state.playbackState === 'paused';
	if (canRenew && isStreamStale(state.streamExpiresAt) && isLocalTarget()) {
		state.renewStream(seconds * 1000, state.playbackState === 'playing');
		if (seconds <= 0) state.markSeek();
		return;
	}
	player.seekTo(seconds);
	state.markSeek();
}
