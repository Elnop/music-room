import { watchPlayerState } from '@/features/playback/shared/player/lib/watchPlayerState';
import { persistLastTrack } from '@/features/playback/lib/persistLastTrack';
import { LAST_TRACK_PLAY_SAVE_DELAY_MS } from '@/features/playback/lastTrackConfig';
import type { PlayerState } from '@/features/playback/shared/player/types/playerStateTypes';

function saved(state: PlayerState) {
	return [
		state.currentTrack,
		state.playbackState,
		state.needsStreamLoad ? state.startPositionMs : null,
	];
}

export function watchLastTrackSaves(userId: string): () => void {
	let timer: ReturnType<typeof setTimeout> | null = null;
	const stop = watchPlayerState(saved, state => {
		if (timer) clearTimeout(timer);
		if (state.playbackState === 'ready') return;
		if (state.playbackState === 'playing') {
			timer = setTimeout(() => persistLastTrack(userId), LAST_TRACK_PLAY_SAVE_DELAY_MS);
			return;
		}
		persistLastTrack(userId);
	});
	return () => {
		if (timer) clearTimeout(timer);
		stop();
	};
}
