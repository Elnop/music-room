import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LibraryOrchestrator } from './LibraryOrchestrator';
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

const navigation = { navigate: jest.fn(), setOptions: jest.fn() };
let routes: ReturnType<typeof mockFetchRoutes>;
let clear: () => void = () => undefined;

function renderLibrary() {
	const view = renderWithClient(
		<LibraryOrchestrator
			route={{ key: 'k', name: 'Playlists' } as Props['route']}
			navigation={navigation as unknown as Props['navigation']}
		/>
	);
	clear = () => view.client.clear();
	return view;
}

async function renderScreen() {
	renderLibrary();
	await screen.findByLabelText('Vos playlists');
	await act(async () => {});
}

beforeEach(async () => {
	jest.clearAllMocks();
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	await resetBackendUrl();
	signIn('me');
	routes = mockFetchRoutes({
		'GET /api/playlists': ok({
			playlists: [
				playlist('Mine'),
				playlist('Shared', { ownerId: 'bob', visibility: 'private', viewerIds: ['me'] }),
			],
		}),
	});
});

afterEach(() => {
	clear();
	jest.restoreAllMocks();
});

describe('LibraryOrchestrator', () => {
	it('shows a skeleton until my playlists answer', () => {
		routes.routes['GET /api/playlists'] = () => new Promise(() => undefined);
		renderLibrary();
		expect(screen.getAllByTestId('skeleton-list').length).toBeGreaterThan(0);
	});

	it('shows only my playlists: the ones I own and the ones shared with me', async () => {
		await renderScreen();
		expect(screen.getByText('Mine')).toBeTruthy();
		expect(screen.getByLabelText('Partagées avec vous')).toBeTruthy();
		expect(screen.getByText('Shared')).toBeTruthy();
		expect(routes.calls()).toEqual(['GET /api/playlists']);
	});

	it('opens a playlist and creates one from the header', async () => {
		await renderScreen();
		fireEvent.press(screen.getByText('Mine'));
		expect(navigation.navigate).toHaveBeenCalledWith('PlaylistDetail', { id: 'Mine' });

		const options = navigation.setOptions.mock.calls.at(-1)?.[0] as {
			headerRight: () => React.ReactElement;
		};
		fireEvent.press(render(options.headerRight()).getByLabelText('Créer une playlist'));
		expect(navigation.navigate).toHaveBeenCalledWith('CreatePlaylist');
	});

	it('offers to create a first playlist and hides the empty shared section', async () => {
		routes.routes['GET /api/playlists'] = ok({ playlists: [] });
		await renderScreen();
		expect(screen.queryByLabelText('Partagées avec vous')).toBeNull();
		fireEvent.press(screen.getByText('Créer une playlist'));
		expect(navigation.navigate).toHaveBeenCalledWith('CreatePlaylist');
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
});
