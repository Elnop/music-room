import React from 'react';
import { act, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { createStore } from 'zustand';
import { registerAuthSession, type SessionView } from '@/shared/services/authSession';
import { friendsApi } from '@/features/friends/services/friendsApi';
import { renderWithClient } from '@/test/renderWithClient';
import { signIn } from '@/test/session';
import '@/test/playback';
import { FriendsOrchestrator } from './FriendsOrchestrator';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.2.3' }));
jest.mock('socket.io-client', () => ({ io: jest.fn() }));

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/shared/utils/apiErrorMessage', () => ({
	apiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

jest.mock('@/shared/utils/toast', () => ({
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

jest.mock('@/features/friends/services/friendsApi', () => ({
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

describe('FriendsOrchestrator', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		signIn('me');
	});

	it('shows only the skeleton while the friends load', async () => {
		jest.mocked(friendsApi.getFriends).mockReturnValue(new Promise(() => undefined));

		renderWithClient(<FriendsOrchestrator />);

		expect(await screen.findByLabelText('Chargement')).toBeTruthy();
		expect(screen.queryByText(SEARCH_EMPTY)).toBeNull();
		expect(screen.queryByPlaceholderText('Rechercher un utilisateur...')).toBeNull();
	});

	it('opens the search once loaded without friends', async () => {
		jest.mocked(friendsApi.getFriends).mockResolvedValue([]);

		renderWithClient(<FriendsOrchestrator />);

		expect(await screen.findByText(SEARCH_EMPTY)).toBeTruthy();
		expect(screen.getByPlaceholderText('Rechercher un utilisateur...')).toBeTruthy();
		expect(screen.queryByLabelText('Chargement')).toBeNull();
	});

	it('renders friends list and toggles control permissions', async () => {
		const friend = { id: 'f1', username: 'bob', displayName: 'Bob' };
		jest.mocked(friendsApi.getFriends).mockResolvedValue([friend]);
		jest.mocked(friendsApi.getMyPermissions).mockResolvedValue([]);

		const onNavigate = jest.fn();
		renderWithClient(<FriendsOrchestrator onNavigateToProfile={onNavigate} />);

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

		renderWithClient(<FriendsOrchestrator />);
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

		renderWithClient(<FriendsOrchestrator />);

		expect(await screen.findByText('Impossible de charger vos amis')).toBeTruthy();
		expect(screen.queryByText(SEARCH_EMPTY)).toBeNull();

		fireEvent.press(screen.getByText('Réessayer'));

		expect(await screen.findByText('bob')).toBeTruthy();
	});
});
