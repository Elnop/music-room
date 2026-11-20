import type { AddQueueItemBody, PlaybackState, QueueStepOutcome } from './playback';
import type { SoundCloudTrack } from '@/shared/tracks/lib/soundcloud.types';

export interface PlaylistPlayback {
	playingUri: string | null;
	state: PlaybackState | null;
}

interface PlayerSnapshot {
	currentTrack: SoundCloudTrack | null;
	queueItemId: string | null;
	loadCounter: number;
	positionMs: number;
}

interface PlaybackBridge {
	usePlaylistPlayback: (playlistId: string) => PlaylistPlayback;
	addToQueue: (track: AddQueueItemBody) => Promise<boolean>;
	playNext: (track: AddQueueItemBody) => Promise<boolean>;
	playPlaylist: (playlistId: string, startTrackId?: string) => Promise<string>;
	next: () => Promise<QueueStepOutcome>;
	previous: () => Promise<QueueStepOutcome>;
	playItem?: (itemId: string) => Promise<QueueStepOutcome>;
	playListTrack: (track: SoundCloudTrack) => Promise<void>;
	playTrack: (track: SoundCloudTrack, queueItemId?: string, startPositionMs?: number) => void;
	pause: () => void;
	resume: () => void;
	stop: () => void;
	getPlayerState: () => PlayerSnapshot;
	setCurrentQueueItem?: (userId: string, itemId: string, version: number) => void;
}

const NOT_REGISTERED = '[playbackBridge] Used before navigation/playbackBridge.ts registered it';
const unavailable = () => Promise.reject(new Error(NOT_REGISTERED));

const unregistered: PlaybackBridge = {
	usePlaylistPlayback: () => ({ playingUri: null, state: null }),
	addToQueue: unavailable,
	playNext: unavailable,
	playPlaylist: unavailable,
	next: unavailable,
	previous: unavailable,
	playItem: unavailable,
	playListTrack: unavailable,
	playTrack: () => undefined,
	pause: () => undefined,
	resume: () => undefined,
	stop: () => undefined,
	getPlayerState: () => ({ currentTrack: null, queueItemId: null, loadCounter: 0, positionMs: 0 }),
	setCurrentQueueItem: () => undefined,
};

let bridge: PlaybackBridge | null = null;

export function registerPlaybackBridge(implementation: PlaybackBridge): void {
	if (bridge) throw new Error('[playbackBridge] Already registered');
	bridge = implementation;
}

export function getPlayback(): PlaybackBridge {
	if (bridge) return bridge;
	if (__DEV__) throw new Error(NOT_REGISTERED);
	return unregistered;
}

export function usePlaylistPlayback(playlistId: string): PlaylistPlayback {
	return getPlayback().usePlaylistPlayback(playlistId);
}
