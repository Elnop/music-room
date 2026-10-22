import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SoundCloudSearchScreen } from './SoundCloudSearchScreen';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

const mockSearch = jest.fn();
const mockState: {
	searchResults: SoundCloudTrack[];
	isSearching: boolean;
	error: string | null;
} = { searchResults: [], isSearching: false, error: null };

jest.mock('@/store/soundcloudStore', () => ({
	useSoundCloudStore: () => ({
		...mockState,
		search: mockSearch,
		clearSearch: jest.fn(),
		clearError: jest.fn(),
	}),
}));

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

jest.mock('@/store/queueStore', () => ({
	useQueueStore: (select: (s: object) => unknown) =>
		select({ playListTrack: jest.fn(), addItem: jest.fn() }),
}));

jest.mock('@/features/playlists/trackActions/components/orchestrators/TrackActionsSheet', () => ({
	TrackActionsSheet: () => null,
}));

jest.mock('@/shared/utils/toast', () => ({
	showError: jest.fn(),
}));

const track = (overrides: Partial<SoundCloudTrack>) =>
	({
		id: 1,
		title: 'Song',
		duration: 30000,
		permalink_url: 'https://soundcloud.com/a/song',
		artwork_url: null,
		user: { username: 'artist', avatar_url: null },
		...overrides,
	}) as SoundCloudTrack;

const renderScreen = async () => {
	render(<SoundCloudSearchScreen />);
	// Ionicons loads its font asynchronously and re-renders once it is ready.
	await act(async () => {});
};

beforeEach(() => {
	jest.useFakeTimers();
	jest.clearAllMocks();
	mockState.searchResults = [];
	mockState.isSearching = false;
	mockState.error = null;
});

afterEach(() => {
	jest.useRealTimers();
});

describe('SoundCloudSearchScreen loading (#307)', () => {
	it('shows the skeleton, not « Aucun titre trouvé », while the debounce is pending', async () => {
		await renderScreen();

		fireEvent.changeText(screen.getByPlaceholderText('Rechercher sur SoundCloud...'), 'daft');

		expect(screen.getByTestId('skeleton-list')).toBeTruthy();
		expect(screen.queryByText('Aucun titre trouvé')).toBeNull();
		expect(mockSearch).not.toHaveBeenCalled();
	});

	it('says « Aucun titre trouvé » once the search returns nothing', async () => {
		await renderScreen();

		fireEvent.changeText(screen.getByPlaceholderText('Rechercher sur SoundCloud...'), 'daft');
		await act(async () => {
			jest.advanceTimersByTime(500);
		});

		expect(mockSearch).toHaveBeenCalledWith('daft');
		expect(screen.queryByTestId('skeleton-list')).toBeNull();
		expect(screen.getByText('Aucun titre trouvé')).toBeTruthy();
	});

	it('cancels the pending search when the field is cleared', async () => {
		await renderScreen();
		const input = screen.getByPlaceholderText('Rechercher sur SoundCloud...');

		fireEvent.changeText(input, 'daft');
		fireEvent.press(screen.getByLabelText('Effacer la recherche'));
		await act(async () => {
			jest.advanceTimersByTime(500);
		});

		expect(mockSearch).not.toHaveBeenCalled();
		expect(screen.queryByTestId('skeleton-list')).toBeNull();
	});
});

describe('SoundCloudSearchScreen preview badge (#307)', () => {
	it('marks a preview-only track and leaves a full one alone', async () => {
		mockState.searchResults = [
			track({ id: 1, title: 'Snip', policy: 'SNIP' }),
			track({ id: 2, title: 'Full', policy: 'ALLOW' }),
		];
		await renderScreen();

		expect(screen.getAllByText('Extrait')).toHaveLength(1);
	});
});
