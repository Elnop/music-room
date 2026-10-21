import { act, renderHook } from '@testing-library/react-native';
import { usePlaylistSocket } from '@/hooks/usePlaylistSocket';
import type {
	PlaylistDeletedEvent,
	PlaylistDetailsEvent,
	PlaylistUpdatedEvent,
} from '@/types/playlist.types';
import type { TrackInPlaylist } from '@/types/track.types';

const mockSocket = {
	connected: true,
	on: jest.fn(),
	off: jest.fn(),
	emit: jest.fn(),
};

const mockSocketState = { socket: mockSocket, isConnected: true };
const mockPlaylistState = {
	applyPlaylistEvent: jest.fn(),
	fetchPlaylistById: jest.fn(),
	applyDetails: jest.fn(),
	removePlaylist: jest.fn(),
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
function setup() {
	renderHook(() => usePlaylistSocket('p1'));
	const call = mockSocket.on.mock.calls.find(([event]) => event === 'playlist:updated');
	return call?.[1] as (data: PlaylistUpdatedEvent) => void;
}

/** The handler the hook registered last for `event`. */
function handlerFor<T>(event: string): (data: T) => void {
	const calls = mockSocket.on.mock.calls.filter(([name]) => name === event);
	return calls.at(-1)?.[1] as (data: T) => void;
}

beforeEach(() => {
	jest.clearAllMocks();
	mockPlaylistState.fetchPlaylistById.mockResolvedValue(undefined);
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('usePlaylistSocket', () => {
	it('joins the playlist room', () => {
		setup();
		expect(mockSocket.emit).toHaveBeenCalledWith('playlist:join', 'p1');
	});

	it('passes every event of the playlist to the store', () => {
		mockPlaylistState.applyPlaylistEvent.mockReturnValue('applied');
		const handler = setup();
		const added: PlaylistUpdatedEvent = { ...base, event: 'track_added', track };
		const moved: PlaylistUpdatedEvent = { ...base, event: 'track_moved', trackId: 't1', rank: 'a' };
		handler(added);
		handler(moved);
		expect(mockPlaylistState.applyPlaylistEvent).toHaveBeenNthCalledWith(1, added);
		expect(mockPlaylistState.applyPlaylistEvent).toHaveBeenNthCalledWith(2, moved);
		expect(mockPlaylistState.fetchPlaylistById).not.toHaveBeenCalled();
	});

	it('does not reload for an event already seen', () => {
		mockPlaylistState.applyPlaylistEvent.mockReturnValue('ignored');
		setup()({ ...base, event: 'track_removed', trackId: 't1' });
		expect(mockPlaylistState.fetchPlaylistById).not.toHaveBeenCalled();
	});

	it('reloads the playlist when the store asks for it', () => {
		mockPlaylistState.applyPlaylistEvent.mockReturnValue('reload');
		setup()({ ...base, rebalanced: true, event: 'track_moved', trackId: 't1', rank: 'a' });
		expect(mockPlaylistState.fetchPlaylistById).toHaveBeenCalledWith('p1');
	});

	it('ignores an event of another playlist', () => {
		setup()({ ...base, playlistId: 'p2', event: 'track_moved', trackId: 't1', rank: 'a' });
		expect(mockPlaylistState.applyPlaylistEvent).not.toHaveBeenCalled();
	});

	it('reloads the playlist when it re-joins the room after a reconnect', () => {
		const { rerender } = renderHook(() => usePlaylistSocket('p1'));
		expect(mockPlaylistState.fetchPlaylistById).not.toHaveBeenCalled();

		mockSocketState.isConnected = false;
		rerender({});
		mockSocketState.isConnected = true;
		rerender({});

		expect(mockSocket.emit).toHaveBeenLastCalledWith('playlist:join', 'p1');
		expect(mockPlaylistState.fetchPlaylistById).toHaveBeenCalledTimes(1);
		expect(mockPlaylistState.fetchPlaylistById).toHaveBeenCalledWith('p1');
	});

	it('passes the new details of this playlist to the store (#342)', () => {
		renderHook(() => usePlaylistSocket('p1'));
		const details: PlaylistDetailsEvent = {
			playlistId: 'p1',
			name: 'Renamed',
			description: 'desc',
			visibility: 'public',
			editMode: 'open',
		};
		handlerFor<PlaylistDetailsEvent>('playlist:details')(details);
		handlerFor<PlaylistDetailsEvent>('playlist:details')({ ...details, playlistId: 'p2' });
		expect(mockPlaylistState.applyDetails).toHaveBeenCalledTimes(1);
		expect(mockPlaylistState.applyDetails).toHaveBeenCalledWith(details);
	});

	it('drops a deleted playlist and reports it (#342)', () => {
		const { result } = renderHook(() => usePlaylistSocket('p1'));
		expect(result.current.deleted).toBe(false);

		act(() => handlerFor<PlaylistDeletedEvent>('playlist:deleted')({ playlistId: 'p2' }));
		expect(result.current.deleted).toBe(false);
		expect(mockPlaylistState.removePlaylist).not.toHaveBeenCalled();

		act(() => handlerFor<PlaylistDeletedEvent>('playlist:deleted')({ playlistId: 'p1' }));
		expect(result.current.deleted).toBe(true);
		expect(mockPlaylistState.removePlaylist).toHaveBeenCalledWith('p1');
	});

	it('leaves the room on unmount', () => {
		const { unmount } = renderHook(() => usePlaylistSocket('p1'));
		unmount();
		expect(mockSocket.off).toHaveBeenCalledWith('playlist:updated', expect.any(Function));
		expect(mockSocket.off).toHaveBeenCalledWith('playlist:details', expect.any(Function));
		expect(mockSocket.off).toHaveBeenCalledWith('playlist:deleted', expect.any(Function));
		expect(mockSocket.emit).toHaveBeenCalledWith('playlist:leave', 'p1');
	});
});
