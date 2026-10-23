import { logger } from '@/shared/utils/logger';
import type {
	AddQueueItemBody,
	OwnerQueue,
	PlaybackState,
	QueueStepOutcome,
} from '@/shared/types/playback';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

export type { OwnerQueue } from '@/shared/types/playback';

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

const EMPTY_QUEUE: OwnerQueue = Object.freeze({
	currentItemId: null,
	items: [],
	version: 0,
});

interface PlaybackEmitterSnapshot {
	currentTrack: SoundCloudTrack | null;
	isPlaying: boolean;
	seekCount: number;
}

interface PlaybackBridge {
	usePlaylistPlayback: (playlistId: string) => PlaylistPlayback;
	usePlayerHeight: () => number;
	useActiveQueue: () => OwnerQueue;
	usePlaybackEmitterState?: () => PlaybackEmitterSnapshot;
	addToQueue: (track: AddQueueItemBody) => Promise<boolean>;
	playNext: (track: AddQueueItemBody) => Promise<boolean>;
	playPlaylist: (playlistId: string, startTrackId?: string) => Promise<string>;
	next: () => Promise<QueueStepOutcome>;
	previous: () => Promise<QueueStepOutcome>;
	playListTrack: (track: SoundCloudTrack) => Promise<void>;
	playTrack: (track: SoundCloudTrack, queueItemId?: string, startPositionMs?: number) => void;
	pause: () => void;
	resume: () => void;
	stop: () => void;
	getPlayerState: () => PlayerSnapshot;
	readPositionMs?: () => number | null;
	setCurrentQueueItem?: (userId: string, itemId: string, version: number) => void;
}

const NOT_REGISTERED = '[playbackBridge] Used before navigation/playbackBridge.ts registered it';
const unavailable = () => Promise.reject(new Error(NOT_REGISTERED));

const unregistered: PlaybackBridge = {
	usePlaylistPlayback: () => ({ playingUri: null, state: null }),
	usePlayerHeight: () => 0,
	useActiveQueue: () => EMPTY_QUEUE,
	usePlaybackEmitterState: () => ({ currentTrack: null, isPlaying: false, seekCount: 0 }),
	addToQueue: unavailable,
	playNext: unavailable,
	playPlaylist: unavailable,
	next: unavailable,
	previous: unavailable,
	playListTrack: unavailable,
	playTrack: () => undefined,
	pause: () => undefined,
	resume: () => undefined,
	stop: () => undefined,
	getPlayerState: () => ({ currentTrack: null, queueItemId: null, loadCounter: 0, positionMs: 0 }),
	readPositionMs: () => null,
	setCurrentQueueItem: () => undefined,
};

let bridge: PlaybackBridge | null = null;

export function registerPlaybackBridge(implementation: PlaybackBridge): void {
	if (bridge) throw new Error('[playbackBridge] Already registered');
	bridge = implementation;
}

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

export function useActiveQueue(): OwnerQueue {
	return getPlayback().useActiveQueue();
}

export function usePlaybackEmitterState(): PlaybackEmitterSnapshot {
	return getPlayback().usePlaybackEmitterState?.() ?? unregistered.usePlaybackEmitterState!();
}

export function readPlaybackPositionMs(): number | null {
	return getPlayback().readPositionMs?.() ?? null;
}
