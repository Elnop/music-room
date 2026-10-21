import { create } from 'zustand';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

/**
 * Playback states for the player state machine
 * - idle: No track loaded
 * - loading: Track selected, stream being fetched
 * - ready: Stream loaded, ready to play (transitions to playing automatically)
 * - playing: Audio is playing
 * - paused: Audio is paused
 */
export type PlaybackState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused';

let positionReader: (() => number) | null = null;

/**
 * Registers how to read the playback position in ms. `PlayerProvider` owns the audio
 * player but the listening status is emitted outside it, so the position goes through here (#295).
 */
export function setPositionReader(reader: (() => number) | null): void {
	positionReader = reader;
}

/** Current playback position in ms, null while no player is registered. */
export function readPositionMs(): number | null {
	return positionReader ? positionReader() : null;
}

interface PlayerState {
	// Track and stream info
	currentTrack: SoundCloudTrack | null;
	streamUrl: string | null;
	pendingTrackId: number | null; // Track ID being loaded
	loadCounter: number; // Incremented on each playTrack to force reload even for same track
	/** Queue item being played, null for a track tapped in a list (#274). */
	queueItemId: string | null;
	/** Where the loaded track starts, in ms, for a transferred playback (#297); null = from 0. */
	startPositionMs: number | null;
	/** When `streamUrl` expires, in epoch ms; null while unknown (#313). */
	streamExpiresAt: number | null;
	/** The stream was renewed after a failure since the last `playTrack`: a further failure is final (#313). */
	streamRenewed: boolean;
	/** Whether the loaded stream starts playing; false after a renewal made while paused (#313). */
	resumeAfterLoad: boolean;
	/** Paused by the system (call, unplugged headset), so a resume by the system resumes the store (#310). */
	pausedBySystem: boolean;
	/** A restored track with no stream loaded yet: play fetches it, at `startPositionMs` (#312). */
	needsStreamLoad: boolean;

	// State machine
	playbackState: PlaybackState;

	// Legacy compatibility (derived from playbackState)
	isPlaying: boolean;
	loading: boolean;
	error: string | null;

	// UI state
	isModalOpen: boolean;

	/** Incremented on each user seek, so the listening status is re-sent with the new position (#295). */
	seekCount: number;

	// Actions
	/** Set the stream URL and, when known, its expiry (epoch ms). */
	setStreamUrl: (url: string | null, expiresAt?: number | null) => void;
	setTrackUnavailableError: (message: string) => void;
	clearError: () => void;
	setPlaybackReady: () => void;
	setPlaybackPlaying: () => void;
	/** Load and play `track`; `startPositionMs` seeks there once the stream is loaded. */
	playTrack: (
		track: SoundCloudTrack,
		queueItemId?: string | null,
		startPositionMs?: number | null
	) => void;
	/**
	 * Reload the current track with a new stream URL, at `positionMs`, playing or
	 * paused (#313). Keeps the track, queue item and modal. `afterFailure` marks the
	 * stream renewed, so a renewal made only because the URL was expiring keeps the retry.
	 */
	renewStream: (positionMs: number, keepPlaying: boolean, afterFailure?: boolean) => void;
	/**
	 * Show `track` paused at `positionMs` without loading its stream (#312): the
	 * last track of a previous session. Play then loads a fresh stream there.
	 */
	restoreTrack: (track: SoundCloudTrack, queueItemId: string | null, positionMs: number) => void;
	/** Move a restored track's start position, before its stream is loaded (#312). */
	setRestoredPosition: (positionMs: number) => void;
	play: () => void;
	pause: () => void;
	/** Mirror a pause the system made on the player (call, unplugged headset) (#310). */
	pauseBySystem: () => void;
	resume: () => void;
	stop: () => void;
	toggleModal: () => void;
	setModalOpen: (isOpen: boolean) => void;
	markSeek: () => void;
}

/**
 * Play of a restored track (#312): load its stream at the saved position, with
 * the modal left as it is. Returns whether it did.
 */
function loadRestored(state: PlayerState): boolean {
	if (!state.needsStreamLoad || !state.currentTrack) return false;
	const { isModalOpen } = state;
	state.playTrack(state.currentTrack, state.queueItemId, state.startPositionMs);
	usePlayerStore.setState({ isModalOpen });
	return true;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
	// Initial state
	currentTrack: null,
	streamUrl: null,
	pendingTrackId: null,
	loadCounter: 0,
	queueItemId: null,
	startPositionMs: null,
	streamExpiresAt: null,
	streamRenewed: false,
	resumeAfterLoad: true,
	pausedBySystem: false,
	needsStreamLoad: false,
	playbackState: 'idle',
	isPlaying: false,
	loading: false,
	error: null,
	isModalOpen: false,
	seekCount: 0,

	setStreamUrl: (url, expiresAt = null) => {
		set({ streamUrl: url, streamExpiresAt: url ? expiresAt : null });
	},

	setTrackUnavailableError: message => {
		set({
			error: message,
			currentTrack: null,
			queueItemId: null,
			streamUrl: null,
			streamExpiresAt: null,
			pendingTrackId: null,
			playbackState: 'idle',
			pausedBySystem: false,
			needsStreamLoad: false,
			isPlaying: false,
			loading: false,
		});
	},

	clearError: () => {
		set({ error: null });
	},

	setPlaybackReady: () => {
		const state = get();
		if (state.playbackState === 'loading') {
			set({
				// A stream renewed while paused comes back paused, so play resumes it (#313).
				playbackState: state.resumeAfterLoad ? 'ready' : 'paused',
				loading: false,
				pendingTrackId: null,
			});
		}
	},

	setPlaybackPlaying: () => {
		const state = get();
		if (
			state.playbackState === 'loading' ||
			state.playbackState === 'ready' ||
			state.playbackState === 'paused'
		) {
			set({
				playbackState: 'playing',
				isPlaying: true,
				loading: false,
				pendingTrackId: null,
			});
		}
	},

	playTrack: (track, queueItemId = null, startPositionMs = null) => {
		set(state => ({
			currentTrack: track,
			queueItemId,
			startPositionMs:
				startPositionMs !== null && Number.isFinite(startPositionMs) && startPositionMs > 0
					? startPositionMs
					: null,
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
			// A list tap closes the modal; a queue step (next/previous, auto-advance) keeps it.
			isModalOpen: queueItemId === null ? false : state.isModalOpen,
			error: null,
		}));
	},

	renewStream: (positionMs, keepPlaying, afterFailure = false) => {
		const { currentTrack } = get();
		if (!currentTrack) return;

		set(state => ({
			startPositionMs: Number.isFinite(positionMs) && positionMs > 0 ? positionMs : null,
			pendingTrackId: currentTrack.id,
			loadCounter: state.loadCounter + 1,
			playbackState: 'loading',
			streamUrl: null,
			streamExpiresAt: null,
			streamRenewed: afterFailure || state.streamRenewed,
			resumeAfterLoad: keepPlaying,
			pausedBySystem: false,
			// Unchanged play state: the listening status is not re-sent for a renewal.
			isPlaying: keepPlaying,
			loading: true,
			error: null,
		}));
	},

	restoreTrack: (track, queueItemId, positionMs) => {
		// loadCounter is left as is: the stream is fetched on play, not now.
		set({
			currentTrack: track,
			queueItemId,
			startPositionMs: Number.isFinite(positionMs) && positionMs > 0 ? positionMs : null,
			pendingTrackId: null,
			playbackState: 'paused',
			streamUrl: null,
			streamExpiresAt: null,
			streamRenewed: false,
			resumeAfterLoad: true,
			pausedBySystem: false,
			needsStreamLoad: true,
			isPlaying: false,
			loading: false,
			error: null,
		});
	},

	setRestoredPosition: positionMs => {
		if (!get().needsStreamLoad) return;
		set({ startPositionMs: Number.isFinite(positionMs) && positionMs > 0 ? positionMs : null });
	},

	play: () => {
		const state = get();
		if (loadRestored(state)) return;
		if (state.playbackState === 'ready' || state.playbackState === 'paused') {
			set({
				playbackState: 'playing',
				isPlaying: true,
				pausedBySystem: false,
			});
		}
	},

	pause: () => {
		const state = get();
		if (state.playbackState === 'playing') {
			set({
				playbackState: 'paused',
				isPlaying: false,
				pausedBySystem: false,
			});
		} else if (state.pausedBySystem) {
			// A user pause during an interruption: the system must not resume it (#310).
			set({ pausedBySystem: false });
		}
	},

	pauseBySystem: () => {
		if (get().playbackState === 'playing') {
			set({
				playbackState: 'paused',
				isPlaying: false,
				pausedBySystem: true,
			});
		}
	},

	resume: () => {
		const state = get();
		if (loadRestored(state)) return;
		if (state.playbackState === 'paused') {
			set({
				playbackState: 'playing',
				isPlaying: true,
				pausedBySystem: false,
			});
		}
	},

	stop: () => {
		set({
			currentTrack: null,
			queueItemId: null,
			startPositionMs: null,
			streamUrl: null,
			streamExpiresAt: null,
			pendingTrackId: null,
			playbackState: 'idle',
			pausedBySystem: false,
			needsStreamLoad: false,
			isPlaying: false,
			loading: false,
			error: null,
		});
	},

	toggleModal: () => {
		set(state => ({ isModalOpen: !state.isModalOpen }));
	},

	setModalOpen: isOpen => {
		set({ isModalOpen: isOpen });
	},

	markSeek: () => {
		set(state => ({ seekCount: state.seekCount + 1 }));
	},
}));
