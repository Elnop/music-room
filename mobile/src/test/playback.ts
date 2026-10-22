import { registerPlaybackBridge, type PlaylistPlayback } from '@/shared/services/playbackBridge';
import type { AddQueueItemBody } from '@/shared/types/playback';

/**
 * A playback contract for tests, registered once when this module loads (once
 * per test file): each test sets `testPlayback.playing` and the mocks it needs.
 */
export const testPlayback = {
	playing: { playingUri: null, state: null } as PlaylistPlayback,
	addToQueue: jest.fn((_track: AddQueueItemBody) => Promise.resolve(true)),
	playNext: jest.fn((_track: AddQueueItemBody) => Promise.resolve(true)),
	playPlaylist: jest.fn((_playlistId: string) => Promise.resolve('played')),
	pause: jest.fn(),
	resume: jest.fn(),
};

registerPlaybackBridge({
	usePlaylistPlayback: () => testPlayback.playing,
	usePlayerHeight: () => 0,
	addToQueue: track => testPlayback.addToQueue(track),
	playNext: track => testPlayback.playNext(track),
	playPlaylist: playlistId => testPlayback.playPlaylist(playlistId),
	pause: () => testPlayback.pause(),
	resume: () => testPlayback.resume(),
});
