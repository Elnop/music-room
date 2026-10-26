import { registerPlaybackBridge, type PlaylistPlayback } from '@/shared/services/playbackBridge';
import type { AddQueueItemBody } from '@/shared/types/playback';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

/** Registered once per test file, at load; each test sets `testPlayback.playing` and the mocks it needs. */
export const testPlayback = {
	playing: { playingUri: null, state: null } as PlaylistPlayback,
	addToQueue: jest.fn((_track: AddQueueItemBody) => Promise.resolve(true)),
	playNext: jest.fn((_track: AddQueueItemBody) => Promise.resolve(true)),
	playPlaylist: jest.fn((_playlistId: string, _startTrackId?: string) => Promise.resolve('played')),
	next: jest.fn(() => Promise.resolve('played' as const)),
	previous: jest.fn(() => Promise.resolve('played' as const)),
	playListTrack: jest.fn((_track: SoundCloudTrack) => Promise.resolve()),
	playTrack: jest.fn(),
	pause: jest.fn(),
	resume: jest.fn(),
	stop: jest.fn(),
	getPlayerState: jest.fn(() => ({
		currentTrack: null,
		queueItemId: null,
		loadCounter: 0,
		positionMs: 0,
	})),
};

registerPlaybackBridge({
	usePlaylistPlayback: () => testPlayback.playing,
	useActiveQueue: () => ({ currentItemId: null, items: [], version: 0 }),
	addToQueue: track => testPlayback.addToQueue(track),
	playNext: track => testPlayback.playNext(track),
	playPlaylist: (playlistId, startTrackId) => testPlayback.playPlaylist(playlistId, startTrackId),
	next: () => testPlayback.next(),
	previous: () => testPlayback.previous(),
	playListTrack: track => testPlayback.playListTrack(track),
	playTrack: (track, queueItemId, startPositionMs) =>
		testPlayback.playTrack(track, queueItemId, startPositionMs),
	pause: () => testPlayback.pause(),
	resume: () => testPlayback.resume(),
	stop: () => testPlayback.stop(),
	getPlayerState: () => testPlayback.getPlayerState(),
});
