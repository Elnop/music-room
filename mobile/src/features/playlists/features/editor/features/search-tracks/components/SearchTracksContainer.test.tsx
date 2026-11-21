import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SearchTracksContainer } from '@/features/playlists/features/editor/features/search-tracks/components/SearchTracksContainer';
import { Text } from '@/shared/theme/components/Text';
import { createQueryClient } from '@/shared/backend/queryClient';
import { queryKeys } from '@/shared/query-keys/keys';
import { resetBackendUrl } from '@/shared/backend/lib/backendUrl';
import { showError } from '@/shared/theme/lib/toast';
import type { PlaylistStackParamList } from '@/features/playlists/shared/playlist/lib/types';
import { deferred } from '@test-utils/deferred';
import { renderWithClient } from '@test-utils/renderWithClient';
import { mockFetchRoutes } from '@test-utils/fetchRoutes';
import { fail, ok } from '@test-utils/fetchResponses';
import { signIn } from '@test-utils/session';
import { playlistTrack, playlistWithTracks } from '@test-utils/playlistFixtures';
import { testPlayback } from '@test-utils/playback';
import { noop } from '@test-utils/noop';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/backend/deviceService', () => ({ getAppVersion: () => '1.2.3' }));
jest.mock('socket.io-client', () => ({ io: jest.fn() }));
jest.mock('@/shared/theme/components/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/lib/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});
jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@/shared/theme/lib/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

type Props = NativeStackScreenProps<PlaylistStackParamList, 'SearchTracks'>;

const song = {
	id: 42,
	title: 'Song',
	duration: 61000,
	permalink_url: 'https://soundcloud.com/artist/song',
	artwork_url: null,
	user: { username: 'artist', avatar_url: null },
};
const known = { ...song, id: 43, title: 'Known', permalink_url: 'https://soundcloud.com/a/known' };
const SEARCH = 'GET /api/soundcloud/search?q=daft&limit=20';
const ADD = 'POST /api/playlists/p1/tracks';
let routes: ReturnType<typeof mockFetchRoutes>;
let clear: () => void = noop;

async function renderScreen() {
	const client = createQueryClient();
	client.setQueryData(
		queryKeys.playlists.detail('p1'),
		playlistWithTracks({ tracks: [playlistTrack('k', 'a', known.permalink_url)] })
	);
	renderWithClient(
		<SearchTracksContainer
			route={{ key: 'k', name: 'SearchTracks', params: { playlistId: 'p1' } } as Props['route']}
			navigation={{} as Props['navigation']}
			TrackActionsSheet={({ track }) => (track ? <Text>{`actions ${track.title}`}</Text> : null)}
			playback={testPlayback}
		/>,
		client
	);
	clear = () => client.clear();
	await act(async () => {});
}

async function search() {
	fireEvent.changeText(screen.getByPlaceholderText('Rechercher sur SoundCloud...'), 'daft');
	await screen.findByText('Song', {}, { timeout: 2000 });
}

beforeEach(async () => {
	jest.clearAllMocks();
	await resetBackendUrl();
	signIn('me');
	routes = mockFetchRoutes({
		[SEARCH]: ok({ collection: [song, known] }),
		[ADD]: ok({ track: playlistTrack('t', 'z'), tracksVersion: 2, rebalanced: false }),
	});
});

afterEach(() => clear());

describe('SearchTracksContainer (#307)', () => {
	it('invites to search before anything is typed', async () => {
		await renderScreen();
		expect(
			screen.getByText('Recherchez des titres sur SoundCloud pour les ajouter à votre playlist')
		).toBeTruthy();
	});

	it('shows the skeleton and the bar spinner during the delay, then the results', async () => {
		await renderScreen();
		fireEvent.changeText(screen.getByPlaceholderText('Rechercher sur SoundCloud...'), 'daft');
		expect(screen.getByTestId('skeleton-list')).toBeTruthy();
		expect(screen.getByTestId('search-bar-loading')).toBeTruthy();
		expect(screen.queryByText('Aucun titre trouvé')).toBeNull();
		expect(routes.calls()).toStrictEqual([]);
		expect(await screen.findByText('Song', {}, { timeout: 2000 })).toBeTruthy();
		expect(routes.calls()).toStrictEqual([SEARCH]);
	});

	it('says nothing was found, and drops the results at once when cleared', async () => {
		routes.routes[SEARCH] = ok({ collection: [] });
		await renderScreen();
		fireEvent.changeText(screen.getByPlaceholderText('Rechercher sur SoundCloud...'), 'daft');
		expect(await screen.findByText('Aucun titre trouvé', {}, { timeout: 2000 })).toBeTruthy();
		fireEvent.changeText(screen.getByPlaceholderText('Rechercher sur SoundCloud...'), '');
		expect(screen.queryByText('Aucun titre trouvé')).toBeNull();
	});

	it('checks a track the playlist already holds', async () => {
		await renderScreen();
		await search();
		expect(screen.getByTestId('added-43')).toBeTruthy();
		expect(screen.getByTestId('add-42')).toBeTruthy();
	});

	it('shows the check as soon as the row is tapped, and sends one call for two taps', async () => {
		const answer = deferred<Response>();
		routes.routes[ADD] = () => answer.promise;
		await renderScreen();
		await search();
		fireEvent.press(screen.getByText('Song'));
		fireEvent.press(screen.getByText('Song'));
		expect(screen.getByTestId('added-42')).toBeTruthy();
		await act(async () =>
			answer.resolve(ok({ track: playlistTrack('t', 'z'), tracksVersion: 2, rebalanced: false }))
		);
		expect(routes.calls().filter(c => c === ADD)).toHaveLength(1);
		expect(screen.getByTestId('added-42')).toBeTruthy();
	});

	it('shows an error toast and the + again when the add fails', async () => {
		routes.routes[ADD] = fail(500, 'INTERNAL');
		await renderScreen();
		await search();
		await act(async () => fireEvent.press(screen.getByText('Song')));
		expect(showError).toHaveBeenCalled();
		expect(screen.getByTestId('add-42')).toBeTruthy();
	});

	it('opens the quick actions of a result', async () => {
		await renderScreen();
		await search();
		fireEvent.press(screen.getAllByLabelText('Actions')[0]);
		expect(screen.getByText('actions Song')).toBeTruthy();
	});
});
