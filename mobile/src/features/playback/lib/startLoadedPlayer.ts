import { logger } from '@/shared/logging/logger';
import { isLocalTarget } from '@/features/playback/lib/isLocalTarget';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import type { AudioPlayer } from '@/features/playback/shared/player/types/playerTypes';

export function startLoadedPlayer(player: AudioPlayer): void {
	const state = playerStore.getState();
	if (state.startPositionMs !== null) {
		player
			.seekTo(state.startPositionMs / 1000)
			.then(() => state.markSeek())
			.catch((err) => {
				logger.warn('[PlayerAudioSync] Start position seek failed:', err);
			});
	}
	if (state.resumeAfterLoad) {
		player.play();
		state.setPlaybackPlaying();
	} else {
		state.setPlaybackReady();
	}
}

export function recoverLoadTimeout(): void {
	const state = playerStore.getState();
	if (!state.streamRenewed && isLocalTarget()) {
		state.renewStream(state.startPositionMs ?? 0, state.resumeAfterLoad, true);
	} else {
		state.setTrackUnavailableError('Impossible de charger ce titre');
	}
}
