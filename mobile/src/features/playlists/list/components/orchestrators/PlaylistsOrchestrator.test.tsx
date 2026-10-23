import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlaylistsOrchestrator } from './PlaylistsOrchestrator';
import { resetBackendUrl } from '@/shared/services/backendUrl';
import { showError } from '@/shared/utils/toast';
import { logger } from '@/shared/utils/logger';
import type { Playlist, PlaylistStackParamList } from '@/features/playlists/types';
import { renderWithClient } from '@/test/renderWithClient';
import { mockFetchRoutes } from '@/test/fetchRoutes';
import { fail, ok } from '@/test/fetchResponses';
import { signIn } from '@/test/session';
import '@/test/playback';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.2.3' }));
jest.mock('socket.io-client', () => ({ io: jest.fn() }));
jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});
let mockFocus: () => void = () => undefined;
jest.mock('@react-navigation/native', () => {
	const { useEffect } = jest.requireActual('react');
	return {
		useFocusEffect: (effect: () => void) => {
			mockFocus = effect;
			useEffect(effect, [effect]);
		},
	};
});
jest.mock('@/shared/utils/toast', () => ({ showError: jest.fn() }));

type Props = NativeStackScreenProps<PlaylistStackParamList, 'Playlists'>;

const ME = { id: 'me', username: 'me', displayName: 'Moi' };

const playlist = (id: string, overrides: Partial<Playlist> = {}): Playlist => ({
	id,
	name: id,
	ownerId: 'me',
	collaboratorIds: [],
	viewerIds: [],
	trackCount: 1,
	visibility: 'public',
	editMode: 'open',
	createdAt: '',
	updatedAt: '',
	...overrides,
});

const parentNavigate = jest.fn();
const navigation = {
	navigate: jest.fn(),
	setOptions: jest.fn(),
	getParent: () => ({ navigate: parentNavigate }),
};
let routes: ReturnType<typeof mockFetchRoutes>;
let clear: () => void = () => undefined;

async function renderScreen() {
	const view = renderWithClient(
		<PlaylistsOrchestrator
			route={{ key: 'k', name: 'Playlists' } as Props['route']}
			navigation={navigation as unknown as Props['navigation']}
		/>
	);
	clear = () => view.client.clear();
	await screen.findByText('Vos playlists');
	await act(async () => {});
	return view;
}

beforeEach(async () => {
	jest.clearAllMocks();
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	await resetBackendUrl();
	signIn('me');
	routes = mockFetchRoutes({
		'GET /api/playlists': ok({
			playlists: [
				playlist('Mine', { owner: ME }),
				playlist('Shared', { ownerId: 'bob', visibility: 'private' }),
			],
		}),
		'GET /api/playlists/public': ok({
			playlists: [playlist('Open', { ownerId: 'bob', owner: { id: 'bob', username: 'bob' } })],
		}),
		'GET /api/friends': ok([
			{ id: 'f1', username: 'fred' },
			{ id: 'f2', username: 'nobody' },
		]),
		'GET /api/playlists/user/f1': ok({ playlists: [playlist('Fred mix', { ownerId: 'f1' })] }),
		'GET /api/playlists/user/f2': fail(500, 'INTERNAL'),
	});
});

afterEach(() => {
	clear();
	jest.restoreAllMocks();
});

describe('PlaylistsOrchestrator', () => {
	it('shows a skeleton until my playlists answer', () => {
		routes.routes['GET /api/playlists'] = () => new Promise(() => undefined);
		const view = renderWithClient(
			<PlaylistsOrchestrator
				route={{ key: 'k', name: 'Playlists' } as Props['route']}
				navigation={navigation as unknown as Props['navigation']}
			/>
		);
		clear = () => view.client.clear();
		expect(screen.getAllByTestId('skeleton-list').length).toBeGreaterThan(0);
	});

	it("shows the friends' playlists, mine only, and the public ones", async () => {
		await renderScreen();
		expect(screen.getByText('Fred mix')).toBeTruthy();
		expect(screen.getByText('Mine')).toBeTruthy();
		expect(screen.queryByText('Shared')).toBeNull();
		expect(screen.getByText('Open')).toBeTruthy();
	});

	it('shows every owner as an avatar badge, named only for a screen reader', async () => {
		await renderScreen();
		expect(screen.queryByText(/^par /)).toBeNull();
		expect(screen.getByLabelText('Fred mix, par fred')).toBeTruthy();
		expect(screen.getByLabelText('Mine, par Moi')).toBeTruthy();
		expect(screen.getByLabelText('Open, par bob')).toBeTruthy();
		// Initials without a photo: one badge per card.
		for (const initials of ['FR', 'MO', 'BO']) {
			expect(screen.getByText(initials, { includeHiddenElements: true })).toBeTruthy();
		}
	});

	it('opens a playlist, the form from the header, and the friends tab', async () => {
		routes.routes['GET /api/friends'] = ok([]);
		await renderScreen();
		fireEvent.press(screen.getByLabelText('Mine, par Moi'));
		expect(navigation.navigate).toHaveBeenCalledWith('PlaylistDetail', { id: 'Mine' });
		fireEvent.press(screen.getByText('Trouver des amis'));
		expect(parentNavigate).toHaveBeenCalledWith('FriendsTab');

		const options = navigation.setOptions.mock.calls.at(-1)?.[0] as {
			headerRight: () => React.ReactElement;
		};
		fireEvent.press(render(options.headerRight()).getByLabelText('Créer une playlist'));
		expect(navigation.navigate).toHaveBeenCalledWith('CreatePlaylist');
	});

	it('folds my playlists and the public ones', async () => {
		await renderScreen();
		fireEvent.press(screen.getByLabelText('Vos playlists'));
		expect(screen.queryByText('Mine')).toBeNull();
		fireEvent.press(screen.getByLabelText('Playlists publiques'));
		expect(screen.queryByText('Open')).toBeNull();
	});

	it('offers to create a first playlist, and says when nothing is public', async () => {
		routes.routes['GET /api/playlists'] = ok({ playlists: [] });
		routes.routes['GET /api/playlists/public'] = ok({ playlists: [] });
		await renderScreen();
		fireEvent.press(screen.getByText('Créer une playlist'));
		expect(navigation.navigate).toHaveBeenCalledWith('CreatePlaylist');
		expect(screen.getByText('Aucune playlist publique disponible')).toBeTruthy();
	});

	it('reloads on focus, and toasts a failed pull to refresh', async () => {
		await renderScreen();
		const before = routes.calls().length;
		await act(async () => mockFocus());
		expect(routes.calls().length).toBeGreaterThan(before);

		routes.routes['GET /api/playlists'] = fail(500, 'INTERNAL');
		const refresh = screen.UNSAFE_getByProps({ refreshing: false }).props.onRefresh;
		await act(async () => refresh());
		expect(showError).toHaveBeenCalledTimes(1);
		expect(screen.getByText('Mine')).toBeTruthy();
	});

	it('logs a failed load of the friends and public playlists', async () => {
		routes.routes['GET /api/friends'] = fail(500, 'INTERNAL');
		routes.routes['GET /api/playlists/public'] = fail(500, 'INTERNAL');
		await renderScreen();
		expect(logger.error).toHaveBeenCalledTimes(2);
	});
});
