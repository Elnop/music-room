import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MusicPreferencesContainer } from '@/features/user/features/profile/features/music-preferences/components/MusicPreferencesContainer';
import { privacyApi } from '@/features/user/features/profile/shared/profile/lib/privacyApi';
import type { MusicGenre } from '@/shared/users/user.types';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/backend/deviceService', () => ({ getAppVersion: () => '1.0.0' }));

jest.mock('@/shared/theme/components/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/lib/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/shared/playback/lib/playbackBridge', () => ({
	usePlayerHeight: () => 0,
}));

jest.mock('@/shared/backend/lib/authSession', () => ({
	useSession: () => true,
}));

jest.mock('@/features/user/features/profile/shared/profile/lib/privacyApi', () => ({
	privacyApi: {
		getMusicPreferences: jest.fn(),
		updateMusicPreferences: jest.fn(),
	},
}));

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ goBack: mockGoBack }),
}));

function renderLoaded(): Promise<void> {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	render(
		<QueryClientProvider client={client}>
			<MusicPreferencesContainer />
		</QueryClientProvider>
	);
	return screen.findByText(/Quels genres aimez-vous/).then(() => undefined);
}

describe('MusicPreferencesScreen', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(privacyApi.getMusicPreferences).mockResolvedValue({
			userId: 'me',
			genres: ['rock'] as MusicGenre[],
			updatedAt: '2026-10-01',
		});
		jest.mocked(privacyApi.updateMusicPreferences).mockResolvedValue({
			userId: 'me',
			genres: ['rock', 'pop'] as MusicGenre[],
			updatedAt: '2026-10-01',
		});
	});

	it('renders loaded genres and toggles a new genre', async () => {
		await renderLoaded();

		expect(screen.getByText('1/5 choisi')).toBeTruthy();

		fireEvent.press(screen.getByText('Pop'));
		expect(screen.getByText('2/5 choisis')).toBeTruthy();

		fireEvent.press(screen.getByText('Enregistrer'));
		await waitFor(() => {
			expect(privacyApi.updateMusicPreferences).toHaveBeenCalledWith({
				genres: ['rock', 'pop'],
			});
			expect(mockGoBack).toHaveBeenCalled();
		});
	});
});
