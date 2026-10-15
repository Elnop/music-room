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
	setStreamUrl: (url: string | null) => void;
	setLoading: (loading: boolean) => void;
	setError: (error: string | null) => void;
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
	play: () => void;
	pause: () => void;
	resume: () => void;
	stop: () => void;
	toggleModal: () => void;
	setModalOpen: (isOpen: boolean) => void;
	markSeek: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
	// Initial state
	currentTrack: null,
	streamUrl: null,
	pendingTrackId: null,
	loadCounter: 0,
	queueItemId: null,
	startPositionMs: null,
	playbackState: 'idle',
	isPlaying: false,
	loading: false,
	error: null,
	isModalOpen: false,
	seekCount: 0,

	setStreamUrl: url => {
		set({ streamUrl: url });
	},

	setLoading: loading => {
		set(state => ({
			loading,
			playbackState: loading && state.playbackState === 'idle' ? 'loading' : state.playbackState,
		}));
	},

	setError: error => {
		set({
			error,
			loading: false,
			playbackState: error ? 'idle' : get().playbackState,
			pendingTrackId: error ? null : get().pendingTrackId,
		});
	},

	setTrackUnavailableError: message => {
		if (__DEV__) console.log('🔴 [playerStore] Track unavailable:', message);
		set({
			error: message,
			currentTrack: null,
			queueItemId: null,
			streamUrl: null,
			pendingTrackId: null,
			playbackState: 'idle',
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
			if (__DEV__) console.log('🎵 [playerStore] Stream ready, transitioning to ready state');
			set({
				playbackState: 'ready',
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
			if (__DEV__) console.log('🎵 [playerStore] Transitioning to playing state');
			set({
				playbackState: 'playing',
				isPlaying: true,
				loading: false,
				pendingTrackId: null,
			});
		}
	},

	playTrack: (track, queueItemId = null, startPositionMs = null) => {
		if (__DEV__)
			console.log('🎵 [playerStore] playTrack called:', {
				id: track.id,
				title: track.title,
				queueItemId,
				startPositionMs,
			});

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
			isPlaying: false,
			loading: true,
			// A list tap closes the modal; a queue step (next/previous, auto-advance) keeps it.
			isModalOpen: queueItemId === null ? false : state.isModalOpen,
			error: null,
		}));
	},

	play: () => {
		const state = get();
		if (state.playbackState === 'ready' || state.playbackState === 'paused') {
			set({
				playbackState: 'playing',
				isPlaying: true,
			});
		}
	},

	pause: () => {
		const state = get();
		if (state.playbackState === 'playing') {
			if (__DEV__) console.log('🎵 [playerStore] Pausing playback');
			set({
				playbackState: 'paused',
				isPlaying: false,
			});
		}
	},

	resume: () => {
		const state = get();
		if (state.playbackState === 'paused') {
			if (__DEV__) console.log('🎵 [playerStore] Resuming playback');
			set({
				playbackState: 'playing',
				isPlaying: true,
			});
		}
	},

	stop: () => {
		if (__DEV__) console.log('🎵 [playerStore] Stopping playback');
		set({
			currentTrack: null,
			queueItemId: null,
			startPositionMs: null,
			streamUrl: null,
			pendingTrackId: null,
			playbackState: 'idle',
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
