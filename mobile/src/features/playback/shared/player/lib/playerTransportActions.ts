import { initialPlayerState } from '@/features/playback/shared/player/configs/playerStateConfig';
import type {
	PlayerGet,
	PlayerSet,
	PlayerState,
} from '@/features/playback/shared/player/types/playerStateTypes';

type PlayerTransportActions = Pick<
	PlayerState,
	'play' | 'pause' | 'pauseBySystem' | 'resume' | 'stop'
>;

const RESUMABLE_STATES = new Set<PlayerState['playbackState']>(['ready', 'paused']);

function loadRestored(set: PlayerSet, state: PlayerState): boolean {
	if (!state.needsStreamLoad || !state.currentTrack) return false;
	const { isModalOpen } = state;
	state.playTrack(state.currentTrack, state.queueItemId, state.startPositionMs);
	set({ isModalOpen });
	return true;
}

export function playerTransportActions(set: PlayerSet, get: PlayerGet): PlayerTransportActions {
	return {
		play: () => {
			if (loadRestored(set, get()) || !RESUMABLE_STATES.has(get().playbackState)) return;
			set({ playbackState: 'playing', isPlaying: true, pausedBySystem: false });
		},
		pause: () => {
			if (get().playbackState === 'playing') {
				set({ playbackState: 'paused', isPlaying: false, pausedBySystem: false });
			} else if (get().pausedBySystem) {
				set({ pausedBySystem: false });
			}
		},
		pauseBySystem: () => {
			if (get().playbackState !== 'playing') return;
			set({ playbackState: 'paused', isPlaying: false, pausedBySystem: true });
		},
		resume: () => {
			if (loadRestored(set, get()) || get().playbackState !== 'paused') return;
			set({ playbackState: 'playing', isPlaying: true, pausedBySystem: false });
		},
		stop: () => set({ ...initialPlayerState, loadCounter: get().loadCounter }),
	};
}
