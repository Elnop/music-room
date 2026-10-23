import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchOrchestrator } from './components/orchestrators/SearchOrchestrator';
import { searchApi } from '@/features/search/services/searchApi';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

const mockPlayListTrack = jest.fn();
const mockAddToQueue = jest.fn();

jest.mock('@/shared/services/playbackBridge', () => ({
	getPlayback: () => ({
		playListTrack: mockPlayListTrack,
		addToQueue: mockAddToQueue,
	}),
	usePlayerHeight: () => 0,
}));

jest.mock('@/features/search/services/searchApi', () => ({
	searchApi: {
		search: jest.fn(),
		searchTracks: jest.fn(),
	},
}));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/shared/utils/toast', () => ({
	showError: jest.fn(),
}));

const mockSearchTracks = searchApi.searchTracks as jest.MockedFunction<
	typeof searchApi.searchTracks
>;

const track = (overrides: Partial<SoundCloudTrack>): SoundCloudTrack => ({
	id: 1,
	title: 'Song',
	duration: 30000,
	permalink_url: 'https://soundcloud.com/a/song',
	artwork_url: null,
	description: null,
	genre: null,
	user: {
		id: 10,
		username: 'artist',
		avatar_url: null,
		permalink_url: 'https://soundcloud.com/artist',
	},
	playable: true,
	...overrides,
});

let queryClient: QueryClient;

const renderScreen = async () => {
	render(
		<QueryClientProvider client={queryClient}>
			<SearchOrchestrator />
		</QueryClientProvider>
	);
	await act(async () => {});
};

beforeEach(() => {
	jest.clearAllMocks();
	queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
		},
	});
	mockSearchTracks.mockResolvedValue([]);
});

afterEach(() => {
	queryClient.clear();
});

describe('SearchScreen loading and debounce (#307)', () => {
	it('shows the skeleton, not « Aucun titre trouvé », while the debounce is pending', async () => {
		await renderScreen();

		fireEvent.changeText(screen.getByPlaceholderText('Rechercher sur SoundCloud...'), 'daft');

		expect(screen.getByTestId('skeleton-list')).toBeTruthy();
		expect(screen.queryByText('Aucun titre trouvé')).toBeNull();
		expect(mockSearchTracks).not.toHaveBeenCalled();
	});

	it('says « Aucun titre trouvé » once the search returns nothing', async () => {
		mockSearchTracks.mockResolvedValueOnce([]);
		await renderScreen();

		fireEvent.changeText(screen.getByPlaceholderText('Rechercher sur SoundCloud...'), 'daft');

		expect(await screen.findByText('Aucun titre trouvé', {}, { timeout: 2500 })).toBeTruthy();
		expect(mockSearchTracks).toHaveBeenCalledWith('daft');
		expect(screen.queryByTestId('skeleton-list')).toBeNull();
	});

	it('cancels the pending search when the field is cleared', async () => {
		await renderScreen();
		const input = screen.getByPlaceholderText('Rechercher sur SoundCloud...');

		fireEvent.changeText(input, 'daft');
		fireEvent.press(screen.getByLabelText('Effacer la recherche'));

		expect(mockSearchTracks).not.toHaveBeenCalled();
		expect(screen.queryByTestId('skeleton-list')).toBeNull();
	});
});

describe('SearchScreen preview badge and actions', () => {
	it('marks a preview-only track and leaves a full one alone', async () => {
		mockSearchTracks.mockResolvedValueOnce([
			track({ id: 1, title: 'Snip', policy: 'SNIP' }),
			track({ id: 2, title: 'Full', policy: 'ALLOW' }),
		]);
		await renderScreen();

		fireEvent.changeText(screen.getByPlaceholderText('Rechercher sur SoundCloud...'), 'sample');

		expect(await screen.findByText('Snip', {}, { timeout: 2500 })).toBeTruthy();
		expect(screen.getAllByText('Extrait')).toHaveLength(1);
		expect(screen.getByText('Full')).toBeTruthy();
	});

	it('plays track on press', async () => {
		const testTrack = track({ id: 42, title: 'Play Me' });
		mockSearchTracks.mockResolvedValueOnce([testTrack]);
		await renderScreen();

		fireEvent.changeText(screen.getByPlaceholderText('Rechercher sur SoundCloud...'), 'play');

		expect(await screen.findByText('Play Me', {}, { timeout: 2500 })).toBeTruthy();

		fireEvent.press(screen.getByLabelText('Écouter Play Me par artist'));
		expect(mockPlayListTrack).toHaveBeenCalledWith(testTrack);
	});

	it('shows failure empty state with retry button when query fails', async () => {
		mockSearchTracks.mockRejectedValueOnce(new Error('Network failure'));
		await renderScreen();

		fireEvent.changeText(screen.getByPlaceholderText('Rechercher sur SoundCloud...'), 'fail');

		expect(await screen.findByText('La recherche a échoué', {}, { timeout: 2500 })).toBeTruthy();
		expect(screen.getByText('Réessayer')).toBeTruthy();

		// Press retry
		mockSearchTracks.mockResolvedValueOnce([track({ id: 99, title: 'Recovered' })]);
		fireEvent.press(screen.getByText('Réessayer'));

		expect(await screen.findByText('Recovered', {}, { timeout: 2500 })).toBeTruthy();
		expect(mockSearchTracks).toHaveBeenCalledTimes(2);
	});
});
