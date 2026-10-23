import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MusicPreferencesOrchestrator } from './orchestrators/MusicPreferencesOrchestrator';
import { privacyApi } from '@/features/profile/services/privacyApi';
import type { MusicGenre } from '@/types/user.types';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/deviceService', () => ({ getAppVersion: () => '1.0.0' }));

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/shared/services/playbackBridge', () => ({
	usePlayerHeight: () => 0,
}));

jest.mock('@/shared/services/authSession', () => ({
	useSession: () => true,
}));

jest.mock('@/features/profile/services/privacyApi', () => ({
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
			<MusicPreferencesOrchestrator />
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
