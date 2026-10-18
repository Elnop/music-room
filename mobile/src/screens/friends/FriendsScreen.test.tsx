import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { FriendsScreen } from '@/screens/friends/FriendsScreen';
import { friendsApi } from '@/services/friendsApi';

jest.mock('@/contexts/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@themes/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/contexts/PlayerContext', () => ({
	usePlayerHeight: () => 0,
}));

jest.mock('@/store/authStore', () => ({
	useAuthStore: () => ({ accessToken: 'token' }),
}));

jest.mock('@utils/apiErrorMessage', () => ({
	apiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

jest.mock('@utils/toast', () => ({
	showError: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ navigate: jest.fn() }),
	// Runs the focus callback once, as on the first focus of the screen.
	useFocusEffect: (callback: () => void) => {
		const { useEffect } = jest.requireActual<typeof React>('react');
		// eslint-disable-next-line react-hooks/exhaustive-deps
		useEffect(() => callback(), []);
	},
}));

jest.mock('@/services/friendsApi', () => ({
	friendsApi: { getFriends: jest.fn() },
}));

jest.mock('@/services/musicControlApi', () => ({
	musicControlApi: { getMyPermissions: jest.fn(() => Promise.resolve([])) },
}));

jest.mock('@/services/profileApi', () => ({
	profileApi: { searchUsers: jest.fn() },
}));

const SEARCH_EMPTY = 'Commencez à taper pour trouver des utilisateurs';

describe('FriendsScreen first load', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('shows only the skeleton while the friends load', async () => {
		jest.mocked(friendsApi.getFriends).mockReturnValue(new Promise(() => undefined));

		render(<FriendsScreen />);

		expect(await screen.findByLabelText('Chargement')).toBeTruthy();
		expect(screen.queryByText(SEARCH_EMPTY)).toBeNull();
		expect(screen.queryByPlaceholderText('Rechercher un utilisateur...')).toBeNull();
	});

	it('opens the search once loaded without friends', async () => {
		jest.mocked(friendsApi.getFriends).mockResolvedValue([]);

		render(<FriendsScreen />);

		expect(await screen.findByText(SEARCH_EMPTY)).toBeTruthy();
		expect(screen.getByPlaceholderText('Rechercher un utilisateur...')).toBeTruthy();
		expect(screen.queryByLabelText('Chargement')).toBeNull();
	});
});
