import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SearchTracksScreen } from './SearchTracksScreen';
import { showError } from '@/shared/utils/toast';
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

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/contexts/PlayerContext', () => ({
	usePlayerHeight: () => 0,
}));

jest.mock('@/store/playlistStore', () => ({
	usePlaylistStore: (select: (s: object) => unknown) =>
		select({ addTrack: mockAddTrack, currentPlaylist: null }),
}));

const mockSearch = jest.fn();
// Stable like the real store's actions: the screen memoizes its debounce on them.
const mockClearSearch = jest.fn();
let mockHasResults = true;

jest.mock('@/store/soundcloudStore', () => ({
	useSoundCloudStore: () => ({
		searchResults: mockHasResults ? [mockResult()] : [],
		isSearching: false,
		search: mockSearch,
		clearSearch: mockClearSearch,
	}),
}));

// Read lazily: jest.mock factories run before this module's constants exist.
function mockResult() {
	return result;
}

jest.mock('@/store/queueStore', () => ({
	useQueueStore: (select: (s: { addItem: jest.Mock }) => unknown) => select({ addItem: jest.fn() }),
}));

jest.mock('@/components/track/TrackActionsSheet', () => ({
	TrackActionsSheet: () => null,
}));

jest.mock('@/shared/utils/toast', () => ({
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
	mockHasResults = true;
});

describe('SearchTracksScreen adding (#307)', () => {
	it('shows the check as soon as the row is tapped, before the add call ends', async () => {
		let resolveAdd: () => void = () => {};
		mockAddTrack.mockReturnValue(new Promise<void>(resolve => (resolveAdd = resolve)));
		await renderScreen();
		expect(screen.getByTestId('add-42')).toBeTruthy();

		fireEvent.press(screen.getByText('Song'));

		expect(screen.getByTestId('added-42')).toBeTruthy();
		expect(mockAddTrack).toHaveBeenCalledWith(
			'p1',
			expect.objectContaining({ trackUri: result.permalink_url })
		);

		await act(async () => resolveAdd());

		expect(screen.getByTestId('added-42')).toBeTruthy();
	});

	it('sends one add call when the row is tapped twice', async () => {
		mockAddTrack.mockReturnValue(new Promise<void>(() => {}));
		await renderScreen();

		fireEvent.press(screen.getByText('Song'));
		fireEvent.press(screen.getByText('Song'));

		expect(mockAddTrack).toHaveBeenCalledTimes(1);
	});

	it('shows an error toast and the + again when the add fails', async () => {
		mockAddTrack.mockRejectedValue(new Error('boom'));
		await renderScreen();

		await act(async () => {
			fireEvent.press(screen.getByText('Song'));
		});

		expect(showError).toHaveBeenCalled();
		expect(screen.queryByTestId('added-42')).toBeNull();
		expect(screen.getByTestId('add-42')).toBeTruthy();
	});
});

describe('SearchTracksScreen loading (#307)', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		mockHasResults = false;
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('shows the skeleton and the bar spinner, not « Aucun titre trouvé », during the debounce', async () => {
		await renderScreen();

		fireEvent.changeText(screen.getByPlaceholderText('Rechercher sur SoundCloud...'), 'daft');

		expect(screen.getByTestId('skeleton-list')).toBeTruthy();
		expect(screen.getByTestId('search-bar-loading')).toBeTruthy();
		expect(screen.queryByText('Aucun titre trouvé')).toBeNull();
		expect(mockSearch).not.toHaveBeenCalled();

		await act(async () => {
			jest.advanceTimersByTime(500);
		});

		expect(mockSearch).toHaveBeenCalledWith('daft');
		expect(screen.queryByTestId('skeleton-list')).toBeNull();
		expect(screen.getByText('Aucun titre trouvé')).toBeTruthy();
	});
});
