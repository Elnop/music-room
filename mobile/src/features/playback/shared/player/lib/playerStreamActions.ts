import { initialPlayerState } from '@/features/playback/shared/player/configs/playerStateConfig';
import type {
	PlayerGet,
	PlayerSet,
	PlayerState,
} from '@/features/playback/shared/player/types/playerStateTypes';

type PlayerStreamActions = Pick<
	PlayerState,
	| 'setStreamUrl'
	| 'setTrackUnavailableError'
	| 'clearError'
	| 'setPlaybackReady'
	| 'setPlaybackPlaying'
>;

const PLAYABLE_STATES = new Set<PlayerState['playbackState']>(['loading', 'ready', 'paused']);

export function playerStreamActions(set: PlayerSet, get: PlayerGet): PlayerStreamActions {
	return {
		setStreamUrl: (url, expiresAt = null, protocol = 'hls') => {
			set({ streamUrl: url, streamProtocol: protocol, streamExpiresAt: url ? expiresAt : null });
		},
		setTrackUnavailableError: (message) => {
			set({ ...initialPlayerState, error: message, loadCounter: get().loadCounter });
		},
		clearError: () => set({ error: null }),
		setPlaybackReady: () => {
			const state = get();
			if (state.playbackState !== 'loading') return;
			const playbackState = state.resumeAfterLoad ? 'ready' : 'paused';
			set({ playbackState, loading: false, pendingTrackId: null });
		},
		setPlaybackPlaying: () => {
			if (!PLAYABLE_STATES.has(get().playbackState)) return;
			set({ playbackState: 'playing', isPlaying: true, loading: false, pendingTrackId: null });
		},
	};
}
