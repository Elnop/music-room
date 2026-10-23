import React from 'react';
import { Alert, Platform } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlaylistDetailOrchestrator } from './PlaylistDetailOrchestrator';
import { testPlayback } from '@/test/playback';
import { useSocketStore } from '@/shared/stores/socketStore';
import { resetBackendUrl } from '@/shared/services/backendUrl';
import { showError, showInfo, showSuccess } from '@/shared/utils/toast';
import { logger } from '@/shared/utils/logger';
import type { PlaylistStackParamList, PlaylistWithTracks } from '@/features/playlists/types';
import { renderWithClient } from '@/test/renderWithClient';
import { mockFetchRoutes } from '@/test/fetchRoutes';
import { fail, ok } from '@/test/fetchResponses';
import { signIn } from '@/test/session';
import { playlistTrack, playlistWithTracks } from '@/test/playlistFixtures';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.2.3' }));
jest.mock('socket.io-client', () => ({ io: jest.fn() }));
jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});
jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@react-navigation/native', () => {
	const { useEffect } = jest.requireActual('react');
	return { useFocusEffect: (effect: () => void) => useEffect(effect, [effect]) };
});
jest.mock('@/shared/hooks/useImageColors', () => ({
	useImageColors: () => ({ dominantColor: null }),
	hexToRgba: () => '',
}));
jest.mock('@/shared/utils/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

interface MockListProps {
	data: { id: string }[];
	renderItem: (info: {
		item: { id: string };
		drag: () => void;
		isActive: boolean;
	}) => React.ReactNode;
	ListHeaderComponent: React.ReactElement;
	ListEmptyComponent: React.ReactElement;
	onReorder: (from: number, to: number) => Promise<void>;
	dragEnabled: boolean;
	refreshControl: React.ReactElement<{ onRefresh: () => void }>;
}
let mockList: MockListProps;
// The list needs native drag: its rows render plainly, and the test reorders through its props.
jest.mock('@/shared/components/lists/ReorderableList', () => {
	const { View } = jest.requireActual('react-native');
	return {
		ReorderableList: (props: MockListProps) => {
			mockList = props;
			return (
				<View>
					{props.ListHeaderComponent}
					{props.data.length === 0
						? props.ListEmptyComponent
						: props.data.map(item => (
								<View key={item.id}>
									{props.renderItem({ item, drag: jest.fn(), isActive: false })}
								</View>
							))}
				</View>
			);
		},
	};
});
jest.mock('@/shared/components/lists/SwipeableTrackItem', () => {
	const { Text: MockText } = jest.requireActual('react-native');
	return {
		SwipeableTrackItem: (props: {
			track: { title: string };
			isCurrent: boolean;
			isPending: boolean;
			onDelete: () => void;
			onAddToQueue: () => void;
			onPress: () => void;
		}) => (
			<>
				<MockText onPress={props.onPress}>
					{`${props.track.title}${props.isCurrent ? ' (current)' : ''}${props.isPending ? ' (pending)' : ''}`}
				</MockText>
				<MockText onPress={props.onDelete}>{`Supprimer ${props.track.title}`}</MockText>
				<MockText onPress={props.onAddToQueue}>{`File ${props.track.title}`}</MockText>
			</>
		),
	};
});

type Props = NativeStackScreenProps<PlaylistStackParamList, 'PlaylistDetail'>;

const ID = 'p1';
const URI = 'https://soundcloud.com/artist/song';
const navigation = {
	navigate: jest.fn(),
	setOptions: jest.fn(),
	goBack: jest.fn(),
	popToTop: jest.fn(),
	canGoBack: jest.fn(() => true),
};
const { addToQueue } = testPlayback;
let routes: ReturnType<typeof mockFetchRoutes>;
let clear: () => void = () => undefined;

const answer = (playlist: Partial<PlaylistWithTracks>) =>
	ok({ playlist: playlistWithTracks(playlist) });

const element = () => (
	<PlaylistDetailOrchestrator
		route={{ key: 'k', name: 'PlaylistDetail', params: { id: ID } } as Props['route']}
		navigation={navigation as unknown as Props['navigation']}
	/>
);

async function renderScreen(playlist: Partial<PlaylistWithTracks> | null = {}) {
	if (playlist) routes.routes[`GET /api/playlists/${ID}`] = answer(playlist);
	const view = renderWithClient(element());
	clear = () => {
		view.unmount();
		view.client.clear();
	};
	if (playlist) await screen.findByText(playlist.name ?? 'Mix');
	return view;
}

/** The last headerRight given to the native header, rendered on its own. */
const renderHeaderRight = () => {
	const options = navigation.setOptions.mock.calls.at(-1)?.[0] as {
		headerRight: () => React.ReactElement;
	};
	return render(options.headerRight());
};

/** Presses the header's ⋯ through its element: fireEvent only reaches the latest render. */
const openOwnerSheet = () => {
	const options = navigation.setOptions.mock.calls.at(-1)?.[0] as {
		headerRight: () => React.ReactElement<{
			children: React.ReactElement<{ onPress: () => void }>;
		}>;
	};
	act(() => options.headerRight().props.children.props.onPress());
};

beforeEach(async () => {
	jest.clearAllMocks();
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	await resetBackendUrl();
	signIn('me');
	testPlayback.playing = { playingUri: null, state: null };
	useSocketStore.setState({ socket: null, isConnected: false });
	routes = mockFetchRoutes({});
});

afterEach(() => {
	clear();
	jest.restoreAllMocks();
});

// Adding or removing the native header subview while the screen re-attaches
// crashes on Android, so headerRight never goes undefined.
describe('PlaylistDetailOrchestrator header button', () => {
	it('keeps headerRight set, without the options button, while the playlist loads', () => {
		routes.routes[`GET /api/playlists/${ID}`] = () => new Promise(() => undefined);
		const view = renderWithClient(element());
		clear = () => {
			view.unmount();
			view.client.clear();
		};
		expect(view.getByTestId('skeleton-list')).toBeTruthy();
		expect(renderHeaderRight().queryByLabelText('Options de la playlist')).toBeNull();
	});

	it("opens the actions sheet from the owner's ⋯", async () => {
		await renderScreen();
		expect(screen.queryByLabelText('Visibilité et droits')).toBeNull();
		openOwnerSheet();
		expect(screen.getByLabelText('Modifier')).toBeTruthy();
		expect(screen.getByLabelText('Supprimer')).toBeTruthy();
	});

	it("keeps headerRight set, without the button, on someone else's playlist", async () => {
		await renderScreen({ ownerId: 'someone-else' });
		expect(navigation.setOptions.mock.calls.every(([options]) => options.headerRight)).toBe(true);
		expect(renderHeaderRight().queryByLabelText('Options de la playlist')).toBeNull();
	});
});

describe('PlaylistDetailOrchestrator load failure', () => {
	it('says the playlist is not found or not accessible on a 404', async () => {
		routes.routes[`GET /api/playlists/${ID}`] = fail(404, 'PLAYLIST_NOT_FOUND');
		await renderScreen(null);
		expect(await screen.findByText('Playlist introuvable ou inaccessible')).toBeTruthy();
		expect(screen.queryByText('Réessayer')).toBeNull();
	});

	it('offers a retry on a server error at once, which refetches', async () => {
		routes.routes[`GET /api/playlists/${ID}`] = fail(500, 'INTERNAL');
		await renderScreen(null);
		expect(await screen.findByText('Impossible de charger la playlist')).toBeTruthy();
		expect(routes.calls()).toEqual([`GET /api/playlists/${ID}`]);

		routes.routes[`GET /api/playlists/${ID}`] = answer({ name: 'Back' });
		fireEvent.press(screen.getByText('Réessayer'));
		expect(await screen.findByText('Back')).toBeTruthy();
	});
});

describe('PlaylistDetailOrchestrator tracks (#307)', () => {
	const tracks = [
		playlistTrack('Song', 'a', URI),
		playlistTrack('Other', 'b'),
		playlistTrack('Again', 'c', URI),
	];

	it('highlights every row of the track playing from this playlist', async () => {
		testPlayback.playing = { playingUri: URI, state: 'playing' };
		await renderScreen({ tracks });
		expect(screen.getByText('Song (current)')).toBeTruthy();
		expect(screen.getByText('Again (current)')).toBeTruthy();
		expect(screen.getByText('Other')).toBeTruthy();
	});

	it('highlights nothing when nothing plays from this playlist', async () => {
		await renderScreen({ tracks });
		expect(screen.queryByText(/\(current\)/)).toBeNull();
	});

	it('shows the empty state', async () => {
		await renderScreen();
		expect(screen.getByText("Aucun titre dans cette playlist pour l'instant")).toBeTruthy();
	});

	it('offers « Ajouter un titre » to an editor, which opens the search', async () => {
		await renderScreen();
		fireEvent.press(screen.getByText('Ajouter un titre'));
		expect(navigation.navigate).toHaveBeenCalledWith('SearchTracks', { playlistId: ID });
	});

	it('offers neither the add row nor the drag to a viewer', async () => {
		await renderScreen({ ownerId: 'someone-else', tracks });
		expect(screen.queryByText('Ajouter un titre')).toBeNull();
		expect(mockList.dragEnabled).toBe(false);
		fireEvent.press(screen.getByText('Supprimer Song'));
		expect(showError).toHaveBeenCalledWith('Vous ne pouvez pas éditer cette playlist');
	});

	it('plays the playlist from the tapped track, with feedback on the row while it starts', async () => {
		let settle: (outcome: string) => void = () => undefined;
		testPlayback.playPlaylist.mockReturnValueOnce(new Promise(resolve => (settle = resolve)));
		await renderScreen({ tracks });

		fireEvent.press(screen.getByText('Other'));
		fireEvent.press(screen.getByText('Other (pending)'));

		expect(testPlayback.playPlaylist).toHaveBeenCalledTimes(1);
		expect(testPlayback.playPlaylist).toHaveBeenCalledWith(ID, 'Other');
		await act(async () => settle('played'));
		expect(screen.getByText('Other')).toBeTruthy();
	});

	it('does not restart the track already playing when it is tapped', async () => {
		testPlayback.playing = { playingUri: URI, state: 'playing' };
		await renderScreen({ tracks });
		fireEvent.press(screen.getByText('Song (current)'));
		expect(testPlayback.playPlaylist).not.toHaveBeenCalled();
	});

	it('adds a row to the queue through the playback contract', async () => {
		await renderScreen({ tracks });
		fireEvent.press(screen.getByText('File Other'));
		expect(addToQueue).toHaveBeenCalledWith(expect.objectContaining({ trackUri: 'Other' }));
	});

	it('removes a track at once, then confirms', async () => {
		routes.routes[`DELETE /api/playlists/${ID}/tracks/Other`] = ok({ tracksVersion: 2 });
		await renderScreen({ tracks });
		fireEvent.press(screen.getByText('Supprimer Other'));
		await waitFor(() => expect(showSuccess).toHaveBeenCalledWith('Titre supprimé'));
		expect(screen.queryByText('Other')).toBeNull();
	});

	it('moves a track with the displayed version', async () => {
		routes.routes[`POST /api/playlists/${ID}/tracks/Again/move`] = ok({
			trackId: 'Again',
			rank: '0',
			tracksVersion: 2,
			rebalanced: false,
		});
		await renderScreen({ tracks });
		await act(() => mockList.onReorder(2, 0));
		expect(routes.fetchMock.mock.calls.at(-1)?.[1]?.body).toBe(
			JSON.stringify({ afterRank: null, expectedVersion: 1 })
		);
		expect(mockList.data.map(t => t.id)).toEqual(['Again', 'Song', 'Other']);
	});

	it('reloads and tells the user when someone else moved the track', async () => {
		routes.routes[`POST /api/playlists/${ID}/tracks/Again/move`] = fail(
			409,
			'TRACK_MOVED_CONCURRENTLY'
		);
		await renderScreen({ tracks });
		await act(() => expect(mockList.onReorder(2, 0)).rejects.toMatchObject({ status: 409 }));
		expect(showError).toHaveBeenCalledWith("Ce titre a été modifié par quelqu'un d'autre");
		expect(routes.calls().filter(c => c === `GET /api/playlists/${ID}`)).toHaveLength(2);
	});

	it('toasts a failed pull to refresh and keeps the tracks', async () => {
		await renderScreen({ tracks });
		routes.routes[`GET /api/playlists/${ID}`] = fail(500, 'INTERNAL');
		const refresh = mockList.refreshControl.props.onRefresh;
		await act(async () => refresh());
		expect(showError).toHaveBeenCalledWith('Impossible de charger la playlist');
		expect(screen.getByText('Song')).toBeTruthy();
	});
});

describe('PlaylistDetailOrchestrator owner actions (#342)', () => {
	const defaultOS = Platform.OS;
	beforeEach(() => {
		jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
		// The sheet runs its action at once on Android (on iOS, after onDismiss).
		Platform.OS = 'android';
	});
	afterEach(() => {
		Platform.OS = defaultOS;
	});

	const pressAction = (label: string) => {
		openOwnerSheet();
		fireEvent.press(screen.getByLabelText(label));
	};

	/** The button of the last confirmation dialog. */
	const alertButton = (text: string) => {
		const buttons = (jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] ?? []) as {
			text: string;
			onPress?: () => void;
		}[];
		return buttons.find(b => b.text === text);
	};

	it('opens the edit form and « Visibilité et droits »', async () => {
		await renderScreen();
		pressAction('Modifier');
		expect(navigation.navigate).toHaveBeenCalledWith('CreatePlaylist', { playlistId: ID });
		pressAction('Visibilité et droits');
		expect(navigation.navigate).toHaveBeenCalledWith('PlaylistSharing', { playlistId: ID });
	});

	it('does nothing when the deletion is cancelled', async () => {
		await renderScreen();
		pressAction('Supprimer');
		alertButton('Annuler')?.onPress?.();
		expect(routes.calls()).not.toContain(`DELETE /api/playlists/${ID}`);
	});

	it('deletes after confirmation and goes back to the list', async () => {
		routes.routes[`DELETE /api/playlists/${ID}`] = ok({});
		await renderScreen();
		pressAction('Supprimer');
		await act(async () => alertButton('Supprimer')?.onPress?.());
		await waitFor(() => expect(navigation.popToTop).toHaveBeenCalledTimes(1));
		expect(showSuccess).toHaveBeenCalledWith('Playlist supprimée');
	});

	it('stays on the playlist with a toast when the deletion fails', async () => {
		routes.routes[`DELETE /api/playlists/${ID}`] = fail(500, 'INTERNAL');
		await renderScreen();
		pressAction('Supprimer');
		await act(async () => alertButton('Supprimer')?.onPress?.());
		await waitFor(() => expect(showError).toHaveBeenCalled());
		expect(navigation.popToTop).not.toHaveBeenCalled();
	});
});

describe('PlaylistDetailOrchestrator deleted while viewing (#342)', () => {
	/** A connected socket whose handlers the test calls. */
	function connectSocket() {
		const handlers: Record<string, (data: unknown) => void> = {};
		const socket = {
			connected: true,
			emit: jest.fn(),
			on: jest.fn((event: string, handler: (data: unknown) => void) => (handlers[event] = handler)),
			off: jest.fn(),
		};
		useSocketStore.setState({ socket: socket as never, isConnected: true });
		return { socket, handlers };
	}

	it('joins the room, then tells the user and goes back', async () => {
		const { socket, handlers } = connectSocket();
		await renderScreen();
		expect(socket.emit).toHaveBeenCalledWith('playlist:join', ID);
		act(() => handlers['playlist:deleted']({ playlistId: ID }));
		expect(showInfo).toHaveBeenCalledWith('Cette playlist a été supprimée');
		expect(navigation.goBack).toHaveBeenCalledTimes(1);
	});

	it('goes to the playlists list when the screen is the root of its stack', async () => {
		const { handlers } = connectSocket();
		navigation.canGoBack.mockReturnValue(false);
		await renderScreen();
		act(() => handlers['playlist:deleted']({ playlistId: ID }));
		expect(navigation.goBack).not.toHaveBeenCalled();
		expect(navigation.navigate).toHaveBeenCalledWith('Playlists');
		navigation.canGoBack.mockReturnValue(true);
	});

	it('applies a track added by someone else', async () => {
		const { handlers } = connectSocket();
		await renderScreen();
		act(() =>
			handlers['playlist:updated']({
				playlistId: ID,
				tracksVersion: 2,
				rebalanced: false,
				event: 'track_added',
				track: playlistTrack('New', 'z'),
			})
		);
		expect(await screen.findByText('New')).toBeTruthy();
	});
});
