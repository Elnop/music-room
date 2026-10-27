import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { ApiError } from '@/shared/services/api';
import { friendsApi } from '@/features/friends/services/friendsApi';
import type { RecommendedProfile } from '@/features/friends/types';
import { renderWithClient } from '@/test/renderWithClient';
import { signIn } from '@/test/session';
import { SimilarProfilesOrchestrator } from './SimilarProfilesOrchestrator';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.2.3' }));
jest.mock('socket.io-client', () => ({ io: jest.fn() }));

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

const mockTabNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ navigate: jest.fn(), getParent: () => ({ navigate: mockTabNavigate }) }),
}));

jest.mock('@/features/friends/services/friendsApi', () => ({
	friendsApi: { getRecommendations: jest.fn() },
}));

const PEARL: RecommendedProfile = {
	id: 'u-pearl',
	username: 'pearl',
	displayName: 'Perle',
	commonGenres: ['pop', 'rnb'],
	score: 0.5,
};
const PUFF: RecommendedProfile = {
	id: 'u-puff',
	username: 'mrspuff',
	commonGenres: ['rock'],
	score: 0.25,
};

const recommendations = jest.mocked(friendsApi.getRecommendations);

describe('SimilarProfilesOrchestrator', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		signIn('me');
	});

	it('lists the profiles without their genres and opens one in the friends tab', async () => {
		recommendations.mockResolvedValue({ hasPreferences: true, profiles: [PEARL, PUFF] });

		const { client } = renderWithClient(<SimilarProfilesOrchestrator />);

		expect(await screen.findByText('Perle')).toBeTruthy();
		expect(screen.queryByText('Pop · R&B')).toBeNull();
		expect(screen.getByText('mrspuff')).toBeTruthy();
		fireEvent.press(screen.getByLabelText('Perle, goûts en commun : Pop · R&B'));
		expect(mockTabNavigate).toHaveBeenCalledWith('FriendsTab', {
			screen: 'UserProfile',
			params: { userId: 'u-pearl' },
			initial: false,
		});
		client.clear();
	});

	it('invites a user without genres to choose some', async () => {
		recommendations.mockResolvedValue({ hasPreferences: false, profiles: [] });

		const { client } = renderWithClient(<SimilarProfilesOrchestrator />);

		fireEvent.press(await screen.findByText('Choisir mes genres'));
		expect(mockTabNavigate).toHaveBeenCalledWith('ProfileTab', {
			screen: 'MusicPreferences',
			initial: false,
		});
		client.clear();
	});

	it('says when no profile shares a genre', async () => {
		recommendations.mockResolvedValue({ hasPreferences: true, profiles: [] });

		const { client } = renderWithClient(<SimilarProfilesOrchestrator />);

		expect(await screen.findByText('Aucun profil aux goûts proches pour le moment')).toBeTruthy();
		client.clear();
	});

	it('offers a retry when the suggestions fail to load', async () => {
		recommendations
			.mockRejectedValueOnce(new ApiError('Bad request', 'VALIDATION_ERROR', undefined, 400))
			.mockResolvedValue({ hasPreferences: true, profiles: [PUFF] });

		const { client } = renderWithClient(<SimilarProfilesOrchestrator />);

		expect(await screen.findByText('Impossible de charger les suggestions')).toBeTruthy();
		fireEvent.press(screen.getByText('Réessayer'));
		expect(await screen.findByText('mrspuff')).toBeTruthy();
		client.clear();
	});
});
