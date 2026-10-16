import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PlaylistDetailScreen } from '@/screens/playlists/PlaylistDetailScreen';
import { ApiError } from '@/services/api';

const ID = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';

const mockFetchPlaylistById = jest.fn();

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
}));

jest.mock('@store/playlistStore', () => ({
	CONFLICT_CODES: [],
	usePlaylistStore: () => ({
		currentPlaylist: null,
		isLoading: false,
		fetchPlaylistById: mockFetchPlaylistById,
		removeTrack: jest.fn(),
		moveTrack: jest.fn(),
		pendingMoves: 0,
		conflictMessage: null,
		clearConflictMessage: jest.fn(),
	}),
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

const renderScreen = () =>
	render(
		<PlaylistDetailScreen
			route={{ key: 'k', name: 'PlaylistDetail', params: { id: ID } } as Props['route']}
			navigation={{ navigate: jest.fn(), setOptions: jest.fn() } as unknown as Props['navigation']}
		/>
	);

beforeEach(() => jest.clearAllMocks());

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
