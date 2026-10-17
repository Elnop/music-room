import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SearchTracksScreen } from '@/screens/playlists/SearchTracksScreen';
import { showError } from '@utils/toast';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

const mockAddTrack = jest.fn();

const result = {
	id: 42,
	title: 'Song',
	duration: 61000,
	permalink_url: 'https://soundcloud.com/artist/song',
	artwork_url: null,
	user: { username: 'artist', avatar_url: null },
} as unknown as SoundCloudTrack;

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

jest.mock('@store/playlistStore', () => ({
	usePlaylistStore: () => ({ addTrack: mockAddTrack, currentPlaylist: null }),
}));

jest.mock('@store/soundcloudStore', () => ({
	useSoundCloudStore: () => ({
		searchResults: [mockResult()],
		isSearching: false,
		search: jest.fn(),
		clearSearch: jest.fn(),
	}),
}));

// Read lazily: jest.mock factories run before this module's constants exist.
function mockResult() {
	return result;
}

jest.mock('@store/queueStore', () => ({
	useQueueStore: (select: (s: { addItem: jest.Mock }) => unknown) => select({ addItem: jest.fn() }),
}));

jest.mock('@components/track/TrackActionsSheet', () => ({
	TrackActionsSheet: () => null,
}));

jest.mock('@utils/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

type Props = React.ComponentProps<typeof SearchTracksScreen>;

const renderScreen = async () => {
	render(
		<SearchTracksScreen
			route={{ key: 'k', name: 'SearchTracks', params: { playlistId: 'p1' } } as Props['route']}
			navigation={{} as Props['navigation']}
		/>
	);
	// Ionicons loads its font asynchronously and re-renders once it is ready.
	await act(async () => {});
};

beforeEach(() => {
	jest.clearAllMocks();
});

describe('SearchTracksScreen adding (#307)', () => {
	it('shows a spinner in the row while the add call runs, then a check', async () => {
		let resolveAdd: () => void = () => {};
		mockAddTrack.mockReturnValue(new Promise<void>(resolve => (resolveAdd = resolve)));
		await renderScreen();
		expect(screen.getByTestId('add-42')).toBeTruthy();

		fireEvent.press(screen.getByText('Song'));

		expect(screen.getByTestId('adding-42')).toBeTruthy();
		expect(mockAddTrack).toHaveBeenCalledWith(
			'p1',
			expect.objectContaining({ trackUri: result.permalink_url })
		);

		await act(async () => resolveAdd());

		expect(screen.queryByTestId('adding-42')).toBeNull();
		expect(screen.getByTestId('added-42')).toBeTruthy();
	});

	it('shows an error toast and the + again when the add fails', async () => {
		mockAddTrack.mockRejectedValue(new Error('boom'));
		await renderScreen();

		await act(async () => {
			fireEvent.press(screen.getByText('Song'));
		});

		expect(showError).toHaveBeenCalled();
		expect(screen.queryByTestId('adding-42')).toBeNull();
		expect(screen.getByTestId('add-42')).toBeTruthy();
	});
});
