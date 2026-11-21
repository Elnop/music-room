import React from 'react';
import { act, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { createStore } from 'zustand';
import { registerAuthSession } from '@/shared/backend/lib/authSession';
import type { SessionView } from '@/shared/backend/lib/authSession';
import { friendsApi } from '@/features/user/features/friends/shared/follows/friendsApi';
import { renderWithClient } from '@test-utils/renderWithClient';
import { signIn } from '@test-utils/session';
import { FriendsContainer } from '@/features/user/features/friends/features/friends-list/components/FriendsContainer';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/backend/deviceService', () => ({ getAppVersion: () => '1.2.3' }));
jest.mock('socket.io-client', () => ({ io: jest.fn() }));

jest.mock('@/shared/theme/components/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/lib/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/shared/backend/lib/apiErrorMessage', () => ({
	apiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

jest.mock('@/shared/theme/lib/toast', () => ({
	showError: jest.fn(),
	showSuccess: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
	const { useEffect } = jest.requireActual('react');
	return {
		useNavigation: () => ({ navigate: jest.fn() }),
		useFocusEffect: (effect: () => void) => {
			useEffect(effect, [effect]);
		},
	};
});

jest.mock('@/features/user/features/friends/shared/follows/friendsApi', () => ({
	friendsApi: {
		getFriends: jest.fn(),
		getMyPermissions: jest.fn(() => Promise.resolve([])),
		grantControl: jest.fn(() => Promise.resolve()),
		revokeControl: jest.fn(() => Promise.resolve()),
		searchUsers: jest.fn(() => Promise.resolve([])),
	},
}));

const SEARCH_EMPTY = 'Commencez à taper pour trouver des utilisateurs';
const BOB = { id: 'f1', username: 'bob', displayName: 'Bob' };

function signedOutSession() {
	const store = createStore<SessionView>(() => ({
		user: null,
		accessToken: null,
		isAuthenticated: false,
	}));
	registerAuthSession({
		store,
		isTokenExpiringSoon: () => false,
		refreshAccessToken: () => Promise.resolve(true),
	});
	return store;
}

describe('FriendsContainer', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		signIn('me');
	});

	it('shows only the skeleton while the friends load', async () => {
		jest.mocked(friendsApi.getFriends).mockReturnValue(new Promise(() => undefined));

		renderWithClient(<FriendsContainer />);

		expect(await screen.findByLabelText('Chargement')).toBeTruthy();
		expect(screen.queryByText(SEARCH_EMPTY)).toBeNull();
		expect(screen.queryByPlaceholderText('Rechercher un utilisateur...')).toBeNull();
	});

	it('opens the search once loaded without friends', async () => {
		jest.mocked(friendsApi.getFriends).mockResolvedValue([]);

		renderWithClient(<FriendsContainer />);

		expect(await screen.findByText(SEARCH_EMPTY)).toBeTruthy();
		expect(screen.getByPlaceholderText('Rechercher un utilisateur...')).toBeTruthy();
		expect(screen.queryByLabelText('Chargement')).toBeNull();
	});

	it('renders friends list and toggles control permissions', async () => {
		const friend = { id: 'f1', username: 'bob', displayName: 'Bob' };
		jest.mocked(friendsApi.getFriends).mockResolvedValue([friend]);
		jest.mocked(friendsApi.getMyPermissions).mockResolvedValue([]);

		const onNavigate = jest.fn();
		renderWithClient(<FriendsContainer onNavigateToProfile={onNavigate} />);

		expect(await screen.findByText('bob')).toBeTruthy();
		expect(screen.getByText('Bob')).toBeTruthy();
		expect(screen.getByText('Mes amis (1)')).toBeTruthy();

		fireEvent.press(screen.getByText('bob'));
		expect(onNavigate).toHaveBeenCalledWith('f1');

		const toggleSwitch = screen.getByRole('switch');
		fireEvent(toggleSwitch, 'valueChange', true);
		await waitFor(() => {
			expect(friendsApi.grantControl).toHaveBeenCalledWith('f1');
		});
	});

	it('shows the friends once the session signs in, instead of switching to the search', async () => {
		const session = signedOutSession();
		jest.mocked(friendsApi.getFriends).mockResolvedValue([BOB]);

		renderWithClient(<FriendsContainer />);
		act(() => {
			session.setState({
				user: { id: 'me', username: 'me' } as SessionView['user'],
				accessToken: 'access',
				isAuthenticated: true,
			});
		});

		expect(await screen.findByText('bob')).toBeTruthy();
		expect(screen.queryByPlaceholderText('Rechercher un utilisateur...')).toBeNull();
	});

	it('shows an error with a retry when the friends fail to load', async () => {
		jest
			.mocked(friendsApi.getFriends)
			.mockRejectedValueOnce(new Error('boom'))
			.mockResolvedValue([BOB]);

		renderWithClient(<FriendsContainer />);

		expect(await screen.findByText('Impossible de charger vos amis')).toBeTruthy();
		expect(screen.queryByText(SEARCH_EMPTY)).toBeNull();

		fireEvent.press(screen.getByText('Réessayer'));

		expect(await screen.findByText('bob')).toBeTruthy();
	});
});
