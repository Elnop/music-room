import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { CreatePlaylistScreen } from '@/screens/playlists/CreatePlaylistScreen';
import { ApiError } from '@/services/api';
import { showError, showSuccess } from '@utils/toast';
import { logger } from '@/utils/logger';

const mockCreatePlaylist = jest.fn();
const mockUpdatePlaylist = jest.fn();
const mockCurrentPlaylist = {
	id: 'p1',
	name: 'Mix',
	description: 'Old description',
	ownerId: 'me',
	tracks: [],
};

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

jest.mock('@store/authStore', () => ({
	useAuthStore: () => ({ user: { id: 'me' } }),
}));

jest.mock('@store/playlistStore', () => ({
	usePlaylistStore: () => ({
		createPlaylist: mockCreatePlaylist,
		updatePlaylist: mockUpdatePlaylist,
		currentPlaylist: mockCurrentPlaylist,
		playlists: [],
	}),
}));

jest.mock('@utils/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

type Props = React.ComponentProps<typeof CreatePlaylistScreen>;

const mockNavigation = { goBack: jest.fn(), replace: jest.fn() };

const renderScreen = (params?: { playlistId?: string }) =>
	render(
		<CreatePlaylistScreen
			route={{ key: 'k', name: 'CreatePlaylist', params } as Props['route']}
			navigation={mockNavigation as unknown as Props['navigation']}
		/>
	);

beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('CreatePlaylistScreen create mode', () => {
	it('opens the new playlist once created (#342)', async () => {
		mockCreatePlaylist.mockResolvedValue({ id: 'new-id' });
		renderScreen();

		fireEvent.changeText(
			screen.getByPlaceholderText('Ma super playlist'),
			'Les tubes du Crabe Croustillant'
		);
		fireEvent.press(screen.getByText('Créer la playlist'));

		await waitFor(() =>
			expect(mockNavigation.replace).toHaveBeenCalledWith('PlaylistDetail', { id: 'new-id' })
		);
		expect(mockCreatePlaylist).toHaveBeenCalledWith('me', {
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

describe('CreatePlaylistScreen edit mode (#342)', () => {
	it('prefills the name and description and hides the switches', () => {
		renderScreen({ playlistId: 'p1' });
		expect(screen.getByDisplayValue('Mix')).toBeTruthy();
		expect(screen.getByDisplayValue('Old description')).toBeTruthy();
		expect(screen.queryByText('Playlist privée')).toBeNull();
		expect(screen.queryByText('Modification restreinte')).toBeNull();
		expect(screen.getByText('Enregistrer')).toBeTruthy();
	});

	it('saves the name and description, then goes back', async () => {
		mockUpdatePlaylist.mockResolvedValue(undefined);
		renderScreen({ playlistId: 'p1' });

		fireEvent.changeText(screen.getByDisplayValue('Mix'), 'Renamed');
		fireEvent.changeText(screen.getByDisplayValue('Old description'), '');
		fireEvent.press(screen.getByText('Enregistrer'));

		await waitFor(() => expect(mockNavigation.goBack).toHaveBeenCalledTimes(1));
		expect(mockUpdatePlaylist).toHaveBeenCalledWith('p1', { name: 'Renamed', description: '' });
		expect(showSuccess).toHaveBeenCalledWith('Playlist modifiée');
		expect(mockCreatePlaylist).not.toHaveBeenCalled();
	});

	it('keeps the form with a toast when the update fails', async () => {
		mockUpdatePlaylist.mockRejectedValue(new ApiError('Boom', 'INTERNAL', undefined, 500));
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
		expect(mockUpdatePlaylist).not.toHaveBeenCalled();
	});
});
