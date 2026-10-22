import { logger } from '@/shared/utils/logger';
import type { AddQueueItemBody, PlaybackState } from '@/shared/types/playback';

/**
 * The playback contract between the player and queue (not migrated yet, #380
 * and #381) and the features that start or show playback. The navigation layer
 * registers the implementation once (`navigation/playbackBridge.ts`); features
 * call it here, so none imports the player or the queue
 * (architecture.md#no-cross-feature-imports).
 */

/** What this device plays from one playlist's queue block (#307). */
export interface PlaylistPlayback {
	/** SoundCloud permalink of the track playing from this playlist, else null. */
	playingUri: string | null;
	/** The player's state while it plays an item of this playlist, else null. */
	state: PlaybackState | null;
}

interface PlaybackBridge {
	/** A React hook: re-renders when the playback of `playlistId` changes. */
	usePlaylistPlayback: (playlistId: string) => PlaylistPlayback;
	/** Bottom space the mini player takes over a screen. */
	usePlayerHeight: () => number;
	/** Adds a track at the end of the active queue; the queue toasts the outcome. */
	addToQueue: (track: AddQueueItemBody) => Promise<boolean>;
	/** Adds a track right after the current one. */
	playNext: (track: AddQueueItemBody) => Promise<boolean>;
	/** Queues a playlist as a block and plays it; 'ignored' while another action runs. */
	playPlaylist: (playlistId: string) => Promise<string>;
	pause: () => void;
	resume: () => void;
}

const NOT_REGISTERED = '[playbackBridge] Used before navigation/playbackBridge.ts registered it';
const unavailable = () => Promise.reject(new Error(NOT_REGISTERED));

/** A release build used before registration: nothing plays, every action fails. */
const unregistered: PlaybackBridge = {
	usePlaylistPlayback: () => ({ playingUri: null, state: null }),
	usePlayerHeight: () => 0,
	addToQueue: unavailable,
	playNext: unavailable,
	playPlaylist: unavailable,
	pause: () => undefined,
	resume: () => undefined,
};

let bridge: PlaybackBridge | null = null;

/** Registered once, before the first render: the hooks must not change afterwards. */
export function registerPlaybackBridge(implementation: PlaybackBridge): void {
	if (bridge) throw new Error('[playbackBridge] Already registered');
	bridge = implementation;
}

/** The registered playback actions, outside React. Fails loudly before registration. */
export function getPlayback(): PlaybackBridge {
	if (bridge) return bridge;
	logger.error(NOT_REGISTERED);
	if (__DEV__) throw new Error(NOT_REGISTERED);
	return unregistered;
}

export function usePlaylistPlayback(playlistId: string): PlaylistPlayback {
	return getPlayback().usePlaylistPlayback(playlistId);
}

export function usePlayerHeight(): number {
	return getPlayback().usePlayerHeight();
}
