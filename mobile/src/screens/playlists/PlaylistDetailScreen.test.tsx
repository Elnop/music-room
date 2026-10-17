import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PlaylistDetailScreen } from '@/screens/playlists/PlaylistDetailScreen';
import { ApiError } from '@/services/api';

const ID = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';

const mockFetchPlaylistById = jest.fn();
let mockCurrentPlaylist: { id: string; ownerId: string; tracks: unknown[] } | null = null;
let mockPlayer: {
	queueItemId: string | null;
	currentTrack: { permalink_url: string } | null;
} = { queueItemId: null, currentTrack: null };
let mockQueueItems: { id: string; sourcePlaylistId: string | null }[] = [];

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('@/contexts/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@themes/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/contexts/PlayerContext', () => ({
	usePlayerHeight: () => 0,
}));

jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-navigation/native', () => {
	const { useEffect } = jest.requireActual('react');
	return { useFocusEffect: (effect: () => void) => useEffect(effect, [effect]) };
});

jest.mock('@/hooks/useImageColors', () => ({
	useImageColors: () => ({ dominantColor: null }),
	hexToRgba: () => '',
}));

jest.mock('@hooks/usePlaylistSocket', () => ({
	usePlaylistSocket: jest.fn(),
}));

jest.mock('@store/authStore', () => ({
	useAuthStore: () => ({ user: { id: 'me' } }),
}));

jest.mock('@store/queueStore', () => ({
	useQueueStore: (select: (s: { addItem: jest.Mock }) => unknown) => select({ addItem: jest.fn() }),
	useActiveQueue: () => ({ currentItemId: null, items: mockQueueItems, version: 1 }),
}));

jest.mock('@store/playerStore', () => ({
	usePlayerStore: (select: (s: typeof mockPlayer) => unknown) => select(mockPlayer),
}));

type MockLibProps = {
	data: { id: string }[];
	keyExtractor: (item: { id: string }) => string;
	renderItem: (info: { item: { id: string }; index: number }) => React.ReactElement;
	ListHeaderComponent?: React.ReactElement | null;
	ListEmptyComponent?: React.ReactElement | null;
};

// The library needs native drag: render the rows plainly.
jest.mock('react-native-reorderable-list', () => {
	const { Fragment } = jest.requireActual('react');
	const { View } = jest.requireActual('react-native');
	return {
		__esModule: true,
		default: (props: MockLibProps) => (
			<View>
				{props.ListHeaderComponent}
				{props.data.length === 0
					? props.ListEmptyComponent
					: props.data.map((item, index) => (
							<Fragment key={props.keyExtractor(item)}>
								{props.renderItem({ item, index })}
							</Fragment>
						))}
			</View>
		),
		reorderItems: <T,>(data: T[]) => data,
		useReorderableDrag: () => jest.fn(),
		useIsActive: () => false,
	};
});

jest.mock('@components/common/SwipeableTrackItem', () => {
	const { Text } = jest.requireActual('react-native');
	return {
		SwipeableTrackItem: ({
			track,
			isCurrent,
		}: {
			track: { title: string };
			isCurrent?: boolean;
		}) => <Text>{`${track.title}${isCurrent ? ' (current)' : ''}`}</Text>,
	};
});

jest.mock('@store/playlistStore', () => ({
	CONFLICT_CODES: [],
	usePlaylistStore: () => ({
		currentPlaylist: mockCurrentPlaylist,
		isLoading: false,
		fetchPlaylistById: mockFetchPlaylistById,
		removeTrack: jest.fn(),
		moveTrack: jest.fn(),
		pendingMoves: 0,
		conflictMessage: null,
		clearConflictMessage: jest.fn(),
	}),
}));

jest.mock('@components/playlist/PlaylistHeader', () => ({
	PlaylistHeader: () => null,
}));

jest.mock('@components/track/TrackActionsSheet', () => ({
	TrackActionsSheet: () => null,
}));

jest.mock('@utils/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

type Props = React.ComponentProps<typeof PlaylistDetailScreen>;

const mockSetOptions = jest.fn();
const mockNavigate = jest.fn();

const screenElement = () => (
	<PlaylistDetailScreen
		route={{ key: 'k', name: 'PlaylistDetail', params: { id: ID } } as Props['route']}
		navigation={
			{ navigate: mockNavigate, setOptions: mockSetOptions } as unknown as Props['navigation']
		}
	/>
);

const renderScreen = () => render(screenElement());

beforeEach(() => {
	jest.clearAllMocks();
	mockCurrentPlaylist = null;
	mockPlayer = { queueItemId: null, currentTrack: null };
	mockQueueItems = [];
	mockFetchPlaylistById.mockResolvedValue(undefined);
});

// Last headerRight given to the native header, rendered on its own.
const renderHeaderRight = () => {
	const options = mockSetOptions.mock.calls.at(-1)?.[0] as { headerRight?: () => React.ReactNode };
	expect(options.headerRight).toBeDefined();
	return render(<>{options.headerRight?.()}</>);
};

// #343: adding or removing the native header subview while the screen
// re-attaches crashes on Android, so headerRight never goes undefined.
describe('PlaylistDetailScreen header button', () => {
	it('keeps headerRight set, without the options button, while the playlist is not loaded', () => {
		renderScreen();

		const header = renderHeaderRight();
		expect(header.queryByLabelText('Options de la playlist')).toBeNull();
	});

	it("shows the options button on the owner's playlist", () => {
		mockCurrentPlaylist = { id: ID, ownerId: 'me', tracks: [] };
		renderScreen();

		const header = renderHeaderRight();
		fireEvent.press(header.getByLabelText('Options de la playlist'));
		expect(mockNavigate).toHaveBeenCalledWith('PlaylistSharing', { playlistId: ID });
	});

	it('keeps headerRight set when the owner playlist goes null during a reload', () => {
		mockCurrentPlaylist = { id: ID, ownerId: 'me', tracks: [] };
		const { rerender } = renderScreen();

		mockCurrentPlaylist = null;
		rerender(screenElement());

		expect(mockSetOptions.mock.calls.length).toBeGreaterThan(1);
		expect(mockSetOptions.mock.calls.every(([options]) => options.headerRight)).toBe(true);
		expect(renderHeaderRight().queryByLabelText('Options de la playlist')).toBeNull();
	});

	it("keeps headerRight set, without the button, on someone else's playlist", () => {
		mockCurrentPlaylist = { id: ID, ownerId: 'someone-else', tracks: [] };
		renderScreen();

		const header = renderHeaderRight();
		expect(header.queryByLabelText('Options de la playlist')).toBeNull();
	});
});

describe('PlaylistDetailScreen load failure', () => {
	it('says the playlist is not found or not accessible on a 404', async () => {
		mockFetchPlaylistById.mockRejectedValue(new ApiError('Not found', 'NOT_FOUND', undefined, 404));
		renderScreen();

		expect(await screen.findByText('Playlist introuvable ou inaccessible')).toBeTruthy();
		expect(screen.queryByText('Réessayer')).toBeNull();
	});

	it('offers a retry on a server error, which refetches', async () => {
		mockFetchPlaylistById.mockRejectedValue(
			new ApiError('Server error', 'INTERNAL', undefined, 500)
		);
		renderScreen();

		expect(await screen.findByText('Impossible de charger la playlist')).toBeTruthy();
		expect(mockFetchPlaylistById).toHaveBeenCalledTimes(1);

		fireEvent.press(screen.getByText('Réessayer'));

		await waitFor(() => expect(mockFetchPlaylistById).toHaveBeenCalledTimes(2));
		expect(mockFetchPlaylistById).toHaveBeenLastCalledWith(ID);
	});
});

describe('PlaylistDetailScreen tracks (#307)', () => {
	const URI = 'https://soundcloud.com/artist/song';
	const track = (id: string, title: string, trackUri: string) => ({
		id,
		title,
		artist: 'Artist',
		trackUri,
	});

	beforeEach(() => {
		mockCurrentPlaylist = {
			id: ID,
			ownerId: 'me',
			tracks: [
				track('t1', 'Song', URI),
				track('t2', 'Other', 'https://soundcloud.com/artist/other'),
				track('t3', 'Song again', URI),
			],
		};
		mockPlayer = { queueItemId: 'q1', currentTrack: { permalink_url: URI } };
	});

	it('highlights every row of the track playing from this playlist', () => {
		mockQueueItems = [{ id: 'q1', sourcePlaylistId: ID }];
		renderScreen();

		expect(screen.getByText('Song (current)')).toBeTruthy();
		expect(screen.getByText('Song again (current)')).toBeTruthy();
		expect(screen.getByText('Other')).toBeTruthy();
	});

	it('highlights nothing when the same track plays from elsewhere', () => {
		mockQueueItems = [{ id: 'q1', sourcePlaylistId: 'another-playlist' }];
		renderScreen();

		expect(screen.getByText('Song')).toBeTruthy();
		expect(screen.getByText('Song again')).toBeTruthy();
		expect(screen.queryByText(/\(current\)/)).toBeNull();
	});

	it('highlights nothing for a track played from search, outside the queue', () => {
		mockPlayer = { queueItemId: null, currentTrack: { permalink_url: URI } };
		renderScreen();

		expect(screen.queryByText(/\(current\)/)).toBeNull();
	});

	it('shows the empty state without an add action', () => {
		mockCurrentPlaylist = { id: ID, ownerId: 'me', tracks: [] };
		renderScreen();

		expect(screen.getByText("Aucun titre dans cette playlist pour l'instant")).toBeTruthy();
		expect(screen.queryByText('Ajouter des titres')).toBeNull();
	});

	it('offers no add action to a viewer of an empty playlist', () => {
		mockCurrentPlaylist = { id: ID, ownerId: 'someone-else', tracks: [] };
		renderScreen();

		expect(screen.getByText("Aucun titre dans cette playlist pour l'instant")).toBeTruthy();
		expect(screen.queryByText('Ajouter des titres')).toBeNull();
	});
});
