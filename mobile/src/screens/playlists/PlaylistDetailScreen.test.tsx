import React from 'react';
import { Alert, Platform } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PlaylistDetailScreen } from '@/screens/playlists/PlaylistDetailScreen';
import { ApiError } from '@/services/api';
import { showError, showInfo, showSuccess } from '@utils/toast';
import { logger } from '@/utils/logger';

const ID = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';

const mockFetchPlaylistById = jest.fn();
const mockDeletePlaylist = jest.fn();
let mockDeleted = false;
let mockCurrentPlaylist: {
	id: string;
	ownerId: string;
	name?: string;
	tracks: unknown[];
} | null = null;
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
	usePlaylistSocket: () => ({ deleted: mockDeleted }),
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
		deletePlaylist: mockDeletePlaylist,
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
const mockGoBack = jest.fn();
const mockPopToTop = jest.fn();
let mockCanGoBack = true;

const screenElement = () => (
	<PlaylistDetailScreen
		route={{ key: 'k', name: 'PlaylistDetail', params: { id: ID } } as Props['route']}
		navigation={
			{
				navigate: mockNavigate,
				setOptions: mockSetOptions,
				goBack: mockGoBack,
				popToTop: mockPopToTop,
				canGoBack: () => mockCanGoBack,
			} as unknown as Props['navigation']
		}
	/>
);

const renderScreen = () => render(screenElement());

beforeEach(() => {
	jest.clearAllMocks();
	mockCurrentPlaylist = null;
	mockDeleted = false;
	mockCanGoBack = true;
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

	it("shows the options button on the owner's playlist, which opens the actions sheet", () => {
		mockCurrentPlaylist = { id: ID, ownerId: 'me', tracks: [] };
		const view = renderScreen();
		expect(view.queryByLabelText('Visibilité et droits')).toBeNull();

		const header = renderHeaderRight();
		fireEvent.press(header.getByLabelText('Options de la playlist'));
		expect(view.getByLabelText('Modifier')).toBeTruthy();
		expect(view.getByLabelText('Supprimer')).toBeTruthy();
		expect(mockNavigate).not.toHaveBeenCalled();
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

describe('PlaylistDetailScreen owner actions (#342)', () => {
	beforeEach(() => {
		mockCurrentPlaylist = { id: ID, ownerId: 'me', name: 'Mix', tracks: [] };
	});

	/** Open the actions sheet from the header and press one of its rows. */
	// fireEvent only reaches the latest render, so the header button is pressed
	// through its element rather than rendered on its own.
	const pressAction = (view: ReturnType<typeof renderScreen>, label: string) => {
		const options = mockSetOptions.mock.calls.at(-1)?.[0] as {
			headerRight: () => React.ReactElement<{
				children: React.ReactElement<{ onPress: () => void }>;
			}>;
		};
		act(() => options.headerRight().props.children.props.onPress());
		fireEvent.press(view.getByLabelText(label));
	};

	/** The button of the last confirmation dialog with this text. */
	const alertButton = (text: string) => {
		const buttons = (jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] ?? []) as {
			text: string;
			onPress?: () => void;
		}[];
		return buttons.find(b => b.text === text);
	};

	// The sheet runs its action at once on Android (on iOS, after onDismiss).
	const defaultOS = Platform.OS;
	beforeEach(() => {
		jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
		Platform.OS = 'android';
	});
	afterEach(() => {
		Platform.OS = defaultOS;
	});

	it('opens the edit form', () => {
		const view = renderScreen();
		pressAction(view, 'Modifier');
		expect(mockNavigate).toHaveBeenCalledWith('CreatePlaylist', { playlistId: ID });
	});

	it('opens « Visibilité et droits »', () => {
		const view = renderScreen();
		pressAction(view, 'Visibilité et droits');
		expect(mockNavigate).toHaveBeenCalledWith('PlaylistSharing', { playlistId: ID });
	});

	it('does nothing when the deletion is cancelled', () => {
		const view = renderScreen();
		pressAction(view, 'Supprimer');
		expect(Alert.alert).toHaveBeenCalledTimes(1);
		alertButton('Annuler')?.onPress?.();
		expect(mockDeletePlaylist).not.toHaveBeenCalled();
		expect(mockPopToTop).not.toHaveBeenCalled();
	});

	it('deletes after confirmation and goes back to the list', async () => {
		mockDeletePlaylist.mockResolvedValue(undefined);
		const view = renderScreen();
		pressAction(view, 'Supprimer');
		alertButton('Supprimer')?.onPress?.();

		await waitFor(() => expect(mockPopToTop).toHaveBeenCalledTimes(1));
		expect(mockDeletePlaylist).toHaveBeenCalledWith(ID);
		expect(showSuccess).toHaveBeenCalledWith('Playlist supprimée');
	});

	it('stays on the playlist with a toast when the deletion fails', async () => {
		jest.spyOn(logger, 'error').mockImplementation(() => undefined);
		mockDeletePlaylist.mockRejectedValue(new ApiError('Boom', 'INTERNAL', undefined, 500));
		const view = renderScreen();
		pressAction(view, 'Supprimer');
		alertButton('Supprimer')?.onPress?.();

		await waitFor(() => expect(showError).toHaveBeenCalled());
		expect(mockPopToTop).not.toHaveBeenCalled();
	});

	it('offers no actions sheet to a non-owner', () => {
		mockCurrentPlaylist = { id: ID, ownerId: 'someone-else', name: 'Mix', tracks: [] };
		const view = renderScreen();
		expect(renderHeaderRight().queryByLabelText('Options de la playlist')).toBeNull();
		expect(view.queryByLabelText('Supprimer')).toBeNull();
	});
});

describe('PlaylistDetailScreen deleted while viewing (#342)', () => {
	it('tells the user and goes back', () => {
		mockCurrentPlaylist = null;
		mockDeleted = true;
		renderScreen();
		expect(showInfo).toHaveBeenCalledWith('Cette playlist a été supprimée');
		expect(mockGoBack).toHaveBeenCalledTimes(1);
	});

	it('goes to the playlists list when the screen is the root of its stack', () => {
		mockCurrentPlaylist = null;
		mockDeleted = true;
		mockCanGoBack = false;
		renderScreen();
		expect(showInfo).toHaveBeenCalledWith('Cette playlist a été supprimée');
		expect(mockGoBack).not.toHaveBeenCalled();
		expect(mockNavigate).toHaveBeenCalledWith('Playlists');
	});
});
