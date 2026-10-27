import React from 'react';
import { Share, useWindowDimensions } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { friendsApi } from '@/features/friends/services/friendsApi';
import { renderWithClient } from '@/test/renderWithClient';
import { signIn } from '@/test/session';
import '@/test/playback';
import { UserProfileOrchestrator } from './UserProfileOrchestrator';

const ID = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.2.3' }));
jest.mock('socket.io-client', () => ({ io: jest.fn() }));
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: jest.fn(() => ({ width: 390, height: 844, scale: 1, fontScale: 1 })),
}));

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/shared/utils/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

jest.mock('@/shared/services/musicControlBridge', () => ({
	useFriendListening: () => ({
		devices: [],
		canControl: false,
		remotePlay: jest.fn(),
		remotePause: jest.fn(),
		isLoading: false,
		controlError: null,
	}),
}));

jest.mock('@/shared/utils/controlError', () => ({
	controlErrorMessage: jest.fn(),
}));

const profile = {
	id: ID,
	username: 'alice',
	displayName: 'Alice',
	createdAt: '2026-01-15T12:00:00Z',
	isOwnProfile: false,
	isFriend: false,
};

jest.mock('@/features/friends/services/friendsApi', () => ({
	friendsApi: {
		getProfile: jest.fn(() => Promise.resolve(profile)),
		getFollowStatus: jest.fn(() =>
			Promise.resolve({
				isFollowing: false,
				isFollowedBy: false,
				isFriend: false,
				followersCount: 0,
				followingCount: 0,
			})
		),
		getUserPublicPlaylists: jest.fn(() => Promise.resolve([])),
		followUser: jest.fn(() =>
			Promise.resolve({
				success: true,
				status: {
					isFollowing: true,
					isFollowedBy: false,
					isFriend: false,
					followersCount: 1,
					followingCount: 0,
				},
			})
		),
		unfollowUser: jest.fn(() =>
			Promise.resolve({
				success: true,
				status: {
					isFollowing: false,
					isFollowedBy: false,
					isFriend: false,
					followersCount: 0,
					followingCount: 0,
				},
			})
		),
	},
}));

const FOLLOW_BACK_HINT = 'Suivez cet utilisateur en retour pour devenir amis.';

function renderScreen() {
	return renderWithClient(<UserProfileOrchestrator userId={ID} />);
}

function mockFollowStatus(isFollowing: boolean, isFollowedBy: boolean) {
	jest.mocked(friendsApi.getFollowStatus).mockResolvedValueOnce({
		isFollowing,
		isFollowedBy,
		isFriend: isFollowing && isFollowedBy,
		followersCount: 0,
		followingCount: 0,
	});
}

describe('UserProfileOrchestrator', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		signIn('me');
	});

	it('shares the zumik:// link of the profile', async () => {
		const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
		renderScreen();

		fireEvent.press(await screen.findByRole('button', { name: 'Partager' }));

		await waitFor(() =>
			expect(share).toHaveBeenCalledWith({ message: `Alice\nzumik://user/${ID}`, title: 'Alice' })
		);
	});

	it('shows initials, not a lock, when the avatar is hidden by privacy', async () => {
		renderScreen();

		expect(await screen.findByText('A')).toBeTruthy();
	});

	it('explains that following back makes a friend when only they follow me', async () => {
		mockFollowStatus(false, true);
		renderScreen();

		expect(await screen.findByText(FOLLOW_BACK_HINT)).toBeTruthy();
	});

	it('shows no follow-back hint once I follow them too', async () => {
		mockFollowStatus(true, true);
		renderScreen();

		await screen.findByText('Vous suit');
		expect(screen.queryByText(FOLLOW_BACK_HINT)).toBeNull();
	});

	it('dates the membership in French (#341)', async () => {
		renderScreen();

		expect(await screen.findByText('Membre depuis janvier 2026')).toBeTruthy();
	});

	it('allows following and unfollowing the user', async () => {
		mockFollowStatus(false, false);
		renderScreen();

		const followBtn = await screen.findByRole('button', { name: 'Suivre' });
		fireEvent.press(followBtn);

		await waitFor(() => {
			expect(friendsApi.followUser).toHaveBeenCalledWith(ID);
		});
	});

	it('renders user public playlists and handles click', async () => {
		const playlist = {
			id: 'p1',
			name: 'Rock Classics',
			trackCount: 12,
			visibility: 'public' as const,
		};
		jest.mocked(friendsApi.getUserPublicPlaylists).mockResolvedValueOnce([playlist]);

		const onNavigateToPlaylist = jest.fn();
		renderWithClient(
			<UserProfileOrchestrator userId={ID} onNavigateToPlaylist={onNavigateToPlaylist} />
		);

		expect(await screen.findByText('Rock Classics')).toBeTruthy();
		expect(screen.getByText('12 titres • alice')).toBeTruthy();

		fireEvent.press(screen.getByText('Rock Classics'));
		expect(onNavigateToPlaylist).toHaveBeenCalledWith('p1');
	});
});

describe('UserProfileOrchestrator on wide screens', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		signIn('me');
		jest
			.mocked(useWindowDimensions)
			.mockReturnValue({ width: 1440, height: 900, scale: 1, fontScale: 1 });
	});

	afterEach(() => {
		jest
			.mocked(useWindowDimensions)
			.mockReturnValue({ width: 390, height: 844, scale: 1, fontScale: 1 });
	});

	it('offers following and sharing as buttons of its header', async () => {
		const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
		renderScreen();

		fireEvent.press(await screen.findByRole('button', { name: 'Suivre' }));
		fireEvent.press(screen.getByRole('button', { name: 'Partager' }));

		await waitFor(() => expect(friendsApi.followUser).toHaveBeenCalledWith(ID));
		expect(share).toHaveBeenCalledWith({ message: `Alice\nzumik://user/${ID}`, title: 'Alice' });
	});

	it('keeps what privacy hides hidden: initials, no bio, no tastes, no email', async () => {
		renderScreen();

		expect(await screen.findByText('A')).toBeTruthy();
		expect(screen.getByText('Visible uniquement par ses amis')).toBeTruthy();
		expect(screen.getByText('Visibles uniquement par ses amis')).toBeTruthy();
		expect(screen.queryByText('Email')).toBeNull();
		expect(screen.queryByText('Playlists')).toBeNull();
	});

	it('lays out what the user shares in sections', async () => {
		jest.mocked(friendsApi.getProfile).mockResolvedValueOnce({
			...profile,
			bio: 'Hello',
			email: 'alice@zumik.dev',
			musicPreferences: ['rock'],
		});
		jest
			.mocked(friendsApi.getUserPublicPlaylists)
			.mockResolvedValueOnce([
				{ id: 'p1', name: 'Rock Classics', trackCount: 1, visibility: 'public' as const },
			]);
		renderScreen();

		expect(await screen.findByText('Hello')).toBeTruthy();
		expect(screen.getByText('alice@zumik.dev')).toBeTruthy();
		expect(screen.getByText('janvier 2026')).toBeTruthy();
		expect(screen.getByText('Préférences musicales')).toBeTruthy();
		expect(await screen.findByText('1 titre • alice')).toBeTruthy();
	});
});
