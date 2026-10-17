import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PlaylistDetailScreen } from '@/screens/playlists/PlaylistDetailScreen';
import { ApiError } from '@/services/api';

const ID = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';

const mockFetchPlaylistById = jest.fn();
let mockCurrentPlaylist: { id: string; ownerId: string; tracks: unknown[] } | null = null;

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

jest.mock('@components/playlist/PlayPlaylistButton', () => ({
	PLAY_PLAYLIST_BUTTON_SIZE: 56,
	PlayPlaylistButton: () => null,
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
