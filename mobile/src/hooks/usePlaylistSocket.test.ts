import { renderHook } from '@testing-library/react-native';
import { usePlaylistSocket } from '@/hooks/usePlaylistSocket';
import type { PlaylistUpdatedEvent } from '@/types/playlist.types';
import type { TrackInPlaylist } from '@/types/track.types';

const mockSocket = {
	connected: true,
	on: jest.fn(),
	off: jest.fn(),
	emit: jest.fn(),
};

const mockSocketState = { socket: mockSocket, isConnected: true };
const mockPlaylistState = {
	addTrackLocally: jest.fn(),
	removeTrackLocally: jest.fn(),
};

jest.mock('@store/socketStore', () => ({
	useSocketStore: (selector: (state: typeof mockSocketState) => unknown) =>
		selector(mockSocketState),
}));

jest.mock('@store/playlistStore', () => ({
	usePlaylistStore: (selector: (state: typeof mockPlaylistState) => unknown) =>
		selector(mockPlaylistState),
}));

const track: TrackInPlaylist = {
	id: 't1',
	title: 'Title',
	artist: 'Artist',
	durationMs: 1000,
	trackUri: 'https://soundcloud.com/a/t',
	createdAt: '2026-01-01T00:00:00Z',
	updatedAt: '2026-01-01T00:00:00Z',
	rank: 'V',
	addedBy: 'user-1',
	addedAt: '2026-01-01T00:00:00Z',
};

const base = { playlistId: 'p1', tracksVersion: 2, rebalanced: false };

/** Render the hook and return the playlist:updated handler it registered. */
function setup(onReorder = jest.fn()) {
	renderHook(() => usePlaylistSocket('p1', onReorder));
	const call = mockSocket.on.mock.calls.find(([event]) => event === 'playlist:updated');
	return { handler: call?.[1] as (data: PlaylistUpdatedEvent) => void, onReorder };
}

beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('usePlaylistSocket', () => {
	it('joins the playlist room', () => {
		setup();
		expect(mockSocket.emit).toHaveBeenCalledWith('playlist:join', 'p1');
	});

	it('adds the track of a track_added event locally', () => {
		const { handler, onReorder } = setup();
		handler({ ...base, event: 'track_added', track });
		expect(mockPlaylistState.addTrackLocally).toHaveBeenCalledWith('p1', track);
		expect(onReorder).not.toHaveBeenCalled();
	});

	it('removes the track of a track_removed event locally', () => {
		const { handler } = setup();
		handler({ ...base, event: 'track_removed', trackId: 't1' });
		expect(mockPlaylistState.removeTrackLocally).toHaveBeenCalledWith('p1', 't1');
	});

	it('refreshes the playlist on a track_moved event', () => {
		const { handler, onReorder } = setup();
		handler({ ...base, event: 'track_moved', trackId: 't1', rank: 'a' });
		expect(onReorder).toHaveBeenCalledTimes(1);
		expect(mockPlaylistState.addTrackLocally).not.toHaveBeenCalled();
		expect(mockPlaylistState.removeTrackLocally).not.toHaveBeenCalled();
	});

	it('ignores an event of another playlist', () => {
		const { handler, onReorder } = setup();
		handler({ ...base, playlistId: 'p2', event: 'track_moved', trackId: 't1', rank: 'a' });
		expect(onReorder).not.toHaveBeenCalled();
	});
});
