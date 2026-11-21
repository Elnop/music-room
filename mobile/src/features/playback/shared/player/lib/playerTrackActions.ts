import {
	playTrackPatch,
	renewStreamPatch,
	restoreTrackPatch,
	validPos,
} from '@/features/playback/shared/player/lib/playerTransitions';
import type {
	PlayerGet,
	PlayerSet,
	PlayerState,
} from '@/features/playback/shared/player/types/playerStateTypes';

type PlayerTrackActions = Pick<
	PlayerState,
	'playTrack' | 'renewStream' | 'restoreTrack' | 'setRestoredPosition'
>;

export function playerTrackActions(set: PlayerSet, get: PlayerGet): PlayerTrackActions {
	return {
		playTrack: (track, queueItemId = null, startPositionMs = null) => {
			set(state => playTrackPatch(state, { track, queueItemId, startPositionMs }));
		},
		renewStream: (positionMs, keepPlaying, afterFailure = false) => {
			if (!get().currentTrack) return;
			set(state => renewStreamPatch(state, positionMs, { keepPlaying, afterFailure }));
		},
		restoreTrack: (track, queueItemId, positionMs) => {
			set(restoreTrackPatch(get(), { track, queueItemId, startPositionMs: positionMs }));
		},
		setRestoredPosition: pos => {
			if (!get().needsStreamLoad) return;
			set({ startPositionMs: validPos(pos) });
		},
	};
}
