import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlaylistFormOrchestrator } from './PlaylistFormOrchestrator';
import { ThemedSwitch } from '@/shared/components/ui/ThemedSwitch';
import { createQueryClient } from '@/shared/query/queryClient';
import { queryKeys } from '@/shared/query/keys';
import { resetBackendUrl } from '@/shared/services/backendUrl';
import { showError, showSuccess } from '@/shared/utils/toast';
import { logger } from '@/shared/utils/logger';
import type { Playlist, PlaylistStackParamList } from '@/features/playlists/types';
import { renderWithClient } from '@/test/renderWithClient';
import { mockFetchRoutes } from '@/test/fetchRoutes';
import { fail, ok } from '@/test/fetchResponses';
import { signIn } from '@/test/session';
import '@/test/playback';
import { playlistWithTracks } from '@/test/playlistFixtures';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/services/deviceService', () => ({ getAppVersion: () => '1.2.3' }));
jest.mock('socket.io-client', () => ({ io: jest.fn() }));
jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});
jest.mock('@/shared/utils/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

type Props = NativeStackScreenProps<PlaylistStackParamList, 'CreatePlaylist'>;

const mockNavigation = { goBack: jest.fn(), replace: jest.fn() };
let routes: ReturnType<typeof mockFetchRoutes>;
let clear: () => void = () => undefined;
let sentBody: unknown;

const created = { id: 'new-id', name: 'Les tubes du Crabe Croustillant' } as Playlist;

const renderScreen = (params?: { playlistId?: string }) => {
	const client = createQueryClient();
	client.setQueryData(
		queryKeys.playlists.detail('p1'),
		playlistWithTracks({ id: 'p1', name: 'Mix', description: 'Old description' })
	);
	client.setQueryData<Playlist[]>(queryKeys.playlists.list(), [{ id: 'old' } as Playlist]);
	const view = renderWithClient(
		<PlaylistFormOrchestrator
			route={{ key: 'k', name: 'CreatePlaylist', params } as Props['route']}
			navigation={mockNavigation as unknown as Props['navigation']}
		/>,
		client
	);
	clear = () => client.clear();
	return view;
};

beforeEach(async () => {
	jest.clearAllMocks();
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	await resetBackendUrl();
	signIn('me');
	sentBody = undefined;
	routes = mockFetchRoutes({
		'POST /api/playlists': body => {
			sentBody = body;
			return ok({ playlist: created });
		},
		'PATCH /api/playlists/p1': body => {
			sentBody = body;
			return ok({ playlist: { id: 'p1', name: 'Renamed', description: '' } });
		},
	});
});

afterEach(() => {
	clear();
	jest.restoreAllMocks();
});

describe('PlaylistFormOrchestrator create mode', () => {
	it('opens the new playlist once created (#342)', async () => {
		renderScreen();

		fireEvent.changeText(
			screen.getByPlaceholderText('Ma super playlist'),
			'Les tubes du Crabe Croustillant'
		);
		fireEvent.press(screen.getByText('Créer la playlist'));

		await waitFor(() =>
			expect(mockNavigation.replace).toHaveBeenCalledWith('PlaylistDetail', { id: 'new-id' })
		);
		expect(sentBody).toEqual({
			name: 'Les tubes du Crabe Croustillant',
			description: '',
			visibility: 'public',
			editMode: 'open',
		});
		expect(mockNavigation.goBack).not.toHaveBeenCalled();
	});

	it('shows the visibility and edit-right switches', () => {
		renderScreen();
		expect(screen.getByText('Playlist privée')).toBeTruthy();
		expect(screen.getByText('Modification restreinte')).toBeTruthy();
	});

	it('caps the name at 50 characters', () => {
		renderScreen();
		fireEvent.changeText(screen.getByPlaceholderText('Ma super playlist'), 'a'.repeat(60));
		expect(screen.getByText('50/50')).toBeTruthy();
	});
});

describe('PlaylistFormOrchestrator edit mode (#342)', () => {
	it('prefills the name and description and hides the switches', () => {
		renderScreen({ playlistId: 'p1' });
		expect(screen.getByDisplayValue('Mix')).toBeTruthy();
		expect(screen.getByDisplayValue('Old description')).toBeTruthy();
		expect(screen.queryByText('Playlist privée')).toBeNull();
		expect(screen.queryByText('Modification restreinte')).toBeNull();
		expect(screen.getByText('Enregistrer')).toBeTruthy();
	});

	it('saves the name and description, then goes back', async () => {
		renderScreen({ playlistId: 'p1' });

		fireEvent.changeText(screen.getByDisplayValue('Mix'), 'Renamed');
		fireEvent.changeText(screen.getByDisplayValue('Old description'), '');
		fireEvent.press(screen.getByText('Enregistrer'));

		await waitFor(() => expect(mockNavigation.goBack).toHaveBeenCalledTimes(1));
		expect(sentBody).toEqual({ name: 'Renamed', description: '' });
		expect(showSuccess).toHaveBeenCalledWith('Playlist modifiée');
		expect(routes.calls()).toEqual(['PATCH /api/playlists/p1']);
	});

	it('keeps the form with a toast when the update fails', async () => {
		routes.routes['PATCH /api/playlists/p1'] = fail(500, 'INTERNAL');
		renderScreen({ playlistId: 'p1' });

		fireEvent.changeText(screen.getByDisplayValue('Mix'), 'Renamed');
		fireEvent.press(screen.getByText('Enregistrer'));

		await waitFor(() => expect(showError).toHaveBeenCalled());
		expect(mockNavigation.goBack).not.toHaveBeenCalled();
		expect(screen.getByDisplayValue('Renamed')).toBeTruthy();
	});

	it('sends nothing for an empty name', async () => {
		renderScreen({ playlistId: 'p1' });

		fireEvent.changeText(screen.getByDisplayValue('Mix'), '');
		fireEvent.press(screen.getByText('Enregistrer'));

		expect(await screen.findByText('Le nom de la playlist est requis')).toBeTruthy();
		expect(routes.calls()).toEqual([]);
	});
});

describe('PlaylistFormOrchestrator caches', () => {
	it('puts the created playlist at the top of the list, as private and restricted', async () => {
		const view = renderScreen();
		fireEvent.changeText(screen.getByPlaceholderText('Ma super playlist'), 'Mix');
		const [isPrivate, isRestricted] = screen.UNSAFE_getAllByType(ThemedSwitch);
		fireEvent(isPrivate, 'valueChange', true);
		fireEvent(isRestricted, 'valueChange', true);
		expect(screen.getByText('Visible uniquement par les invités')).toBeTruthy();
		fireEvent.press(screen.getByText('Créer la playlist'));
		await waitFor(() => expect(mockNavigation.replace).toHaveBeenCalled());
		expect(sentBody).toMatchObject({ visibility: 'private', editMode: 'restricted' });
		const list = view.client.getQueryData<Playlist[]>(queryKeys.playlists.list());
		expect(list?.map(p => p.id)).toEqual(['new-id', 'old']);
	});

	it('toasts a failed creation and stays on the form', async () => {
		routes.routes['POST /api/playlists'] = fail(500, 'INTERNAL');
		renderScreen();
		fireEvent.changeText(screen.getByPlaceholderText('Ma super playlist'), 'Mix');
		fireEvent.press(screen.getByText('Créer la playlist'));
		await waitFor(() => expect(showError).toHaveBeenCalled());
		expect(mockNavigation.replace).not.toHaveBeenCalled();
	});
});
