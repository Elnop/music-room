import React from 'react';
import { Share } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { UserProfileScreen } from './UserProfileScreen';
import { friendsApi } from '@/services/friendsApi';

const ID = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/contexts/PlayerContext', () => ({
	usePlayerHeight: () => 0,
}));

jest.mock('@/store/authStore', () => ({
	useAuthStore: () => ({ accessToken: 'token' }),
}));

jest.mock('@/shared/utils/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

jest.mock('@/hooks/useMusicControl', () => ({
	controlErrorMessage: jest.fn(),
	useFriendListening: () => ({
		devices: [],
		canControl: false,
		remotePlay: jest.fn(),
		remotePause: jest.fn(),
		isLoading: false,
		controlError: null,
	}),
}));

const profile = {
	id: ID,
	username: 'alice',
	displayName: 'Alice',
	createdAt: '2026-01-15T12:00:00Z',
	isOwnProfile: false,
	isFriend: false,
};

jest.mock('@/services/profileApi', () => ({
	profileApi: { getUserProfile: jest.fn(() => Promise.resolve(profile)) },
}));

jest.mock('@/services/privacyApi', () => ({
	privacyApi: { getFilteredProfile: jest.fn(() => Promise.resolve(profile)) },
}));

jest.mock('@/services/friendsApi', () => ({
	friendsApi: {
		getFollowStatus: jest.fn(() =>
			Promise.resolve({
				isFollowing: false,
				isFollowedBy: false,
				isFriend: false,
				followersCount: 0,
				followingCount: 0,
			})
		),
	},
}));

jest.mock('@/api/playlistApi', () => ({
	playlistApi: { fetchUserPublicPlaylists: jest.fn(() => Promise.resolve([])) },
}));

type Props = React.ComponentProps<typeof UserProfileScreen>;

const FOLLOW_BACK_HINT = 'Suivez cet utilisateur en retour pour devenir amis.';

function renderScreen() {
	return render(
		<UserProfileScreen
			route={{ key: 'k', name: 'UserProfile', params: { userId: ID } } as Props['route']}
			navigation={{ navigate: jest.fn() } as unknown as Props['navigation']}
		/>
	);
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

describe('UserProfileScreen', () => {
	it('shares the zumik:// link of the profile', async () => {
		const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
		render(
			<UserProfileScreen
				route={{ key: 'k', name: 'UserProfile', params: { userId: ID } } as Props['route']}
				navigation={{ navigate: jest.fn() } as unknown as Props['navigation']}
			/>
		);

		fireEvent.press(await screen.findByRole('button', { name: 'Partager' }));

		await waitFor(() =>
			expect(share).toHaveBeenCalledWith({ message: `Alice\nzumik://user/${ID}`, title: 'Alice' })
		);
	});

	it('shows initials, not a lock, when the avatar is hidden by privacy', async () => {
		renderScreen();

		expect(await screen.findByText('AL')).toBeTruthy();
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
});
