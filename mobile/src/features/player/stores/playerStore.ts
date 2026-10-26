import { create } from 'zustand';
import { onSessionEnd } from '@/shared/services/authSession';
import { initialPlayerState, type PlayerState } from './playerState';

export { readPositionMs, setPositionReader } from './positionReader';

const validPos = (p: number | null) => (p !== null && Number.isFinite(p) && p > 0 ? p : null);

function loadRestored(state: PlayerState): boolean {
	if (!state.needsStreamLoad || !state.currentTrack) return false;
	const { isModalOpen } = state;
	state.playTrack(state.currentTrack, state.queueItemId, state.startPositionMs);
	usePlayerStore.setState({ isModalOpen });
	return true;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
	...initialPlayerState,

	setStreamUrl: (url, expiresAt = null, protocol = 'hls') => {
		set({ streamUrl: url, streamProtocol: protocol, streamExpiresAt: url ? expiresAt : null });
	},

	setTrackUnavailableError: message => {
		set({ ...initialPlayerState, error: message, loadCounter: get().loadCounter });
	},

	clearError: () => set({ error: null }),

	setPlaybackReady: () => {
		const state = get();
		if (state.playbackState === 'loading') {
			set({
				playbackState: state.resumeAfterLoad ? 'ready' : 'paused',
				loading: false,
				pendingTrackId: null,
			});
		}
	},

	setPlaybackPlaying: () => {
		const s = get();
		if (
			s.playbackState === 'loading' ||
			s.playbackState === 'ready' ||
			s.playbackState === 'paused'
		) {
			set({ playbackState: 'playing', isPlaying: true, loading: false, pendingTrackId: null });
		}
	},

	playTrack: (track, queueItemId = null, startPositionMs = null) => {
		set(state => ({
			currentTrack: track,
			queueItemId,
			startPositionMs: validPos(startPositionMs),
			pendingTrackId: track.id,
			loadCounter: state.loadCounter + 1,
			playbackState: 'loading',
			streamUrl: null,
			streamExpiresAt: null,
			streamRenewed: false,
			resumeAfterLoad: true,
			pausedBySystem: false,
			needsStreamLoad: false,
			isPlaying: false,
			loading: true,
			isModalOpen: queueItemId === null ? false : state.isModalOpen,
			error: null,
		}));
	},

	renewStream: (positionMs, keepPlaying, afterFailure = false) => {
		const { currentTrack } = get();
		if (!currentTrack) return;
		set(state => ({
			startPositionMs: validPos(positionMs),
			pendingTrackId: currentTrack.id,
			loadCounter: state.loadCounter + 1,
			playbackState: 'loading',
			streamUrl: null,
			streamExpiresAt: null,
			streamRenewed: afterFailure || state.streamRenewed,
			resumeAfterLoad: keepPlaying,
			pausedBySystem: false,
			isPlaying: keepPlaying,
			loading: true,
			error: null,
		}));
	},

	restoreTrack: (track, queueItemId, positionMs) => {
		set({
			...initialPlayerState,
			currentTrack: track,
			queueItemId,
			startPositionMs: validPos(positionMs),
			playbackState: 'paused',
			needsStreamLoad: true,
			loadCounter: get().loadCounter,
		});
	},

	setRestoredPosition: pos => {
		if (!get().needsStreamLoad) return;
		set({ startPositionMs: validPos(pos) });
	},

	play: () => {
		const state = get();
		if (loadRestored(state)) return;
		if (state.playbackState === 'ready' || state.playbackState === 'paused') {
			set({ playbackState: 'playing', isPlaying: true, pausedBySystem: false });
		}
	},

	pause: () => {
		const state = get();
		if (state.playbackState === 'playing') {
			set({ playbackState: 'paused', isPlaying: false, pausedBySystem: false });
		} else if (state.pausedBySystem) {
			set({ pausedBySystem: false });
		}
	},

	pauseBySystem: () => {
		if (get().playbackState === 'playing') {
			set({ playbackState: 'paused', isPlaying: false, pausedBySystem: true });
		}
	},

	resume: () => {
		const state = get();
		if (loadRestored(state)) return;
		if (state.playbackState === 'paused') {
			set({ playbackState: 'playing', isPlaying: true, pausedBySystem: false });
		}
	},

	stop: () => set({ ...initialPlayerState, loadCounter: get().loadCounter }),
	toggleModal: () => set(state => ({ isModalOpen: !state.isModalOpen })),
	setModalOpen: isOpen => set({ isModalOpen: isOpen }),
	markSeek: () => set(state => ({ seekCount: state.seekCount + 1 })),
}));

onSessionEnd(() => {
	usePlayerStore.getState().stop();
});
