import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createStore } from 'zustand';
import { MiniPlayerContainer } from '@/features/playback/features/mini-player/components/MiniPlayerContainer';
import { usePlayerStore } from '@/features/playback/shared/player/stores/playerStore';
import { registerAuthSession } from '@/shared/backend/lib/authSession';
import type { SessionView } from '@/shared/backend/lib/authSession';
import { useConnectStore } from '@/features/playback/shared/player/stores/connectStore';
import { useQueueStore } from '@/features/playback/shared/player/stores/queueStore';
import type { UserProfile } from '@/shared/users/user.types';
import type { SoundCloudTrack } from '@/shared/tracks/lib/soundcloud.types';
import { hapticTap } from '@/shared/theme/lib/haptics';

jest.mock('@/shared/theme/lib/haptics', () => ({
	hapticTap: jest.fn(),
	hapticSelection: jest.fn(),
	hapticSuccess: jest.fn(),
}));

jest.mock('@/shared/theme/components/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/lib/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/backend/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('@/features/playback/shared/player/lib/PlayerContext', () => ({
	usePlayer: () => ({ player: { playing: false } }),
}));

jest.mock('@/features/playback/shared/player/hooks/usePlayerProgress', () => ({
	usePlayerProgress: () => ({ progress: 0, currentTime: 0, duration: 0 }),
}));

const track: SoundCloudTrack = {
	id: 99,
	title: 'Tapped',
	description: null,
	duration: 1000,
	genre: null,
	artwork_url: null,
	permalink_url: 'https://soundcloud.com/artist/tapped',
	user: { id: 1, username: 'x', avatar_url: null, permalink_url: '' },
	playable: true,
};

const testSessionStore = createStore<SessionView>(() => ({
	user: { id: 'me' } as UserProfile,
	accessToken: 'test-token',
	isAuthenticated: true,
}));

registerAuthSession({
	store: testSessionStore,
	isTokenExpiringSoon: () => false,
	refreshAccessToken: async () => true,
});

const mockNext = jest.fn(async () => 'played' as const);

describe('MiniPlayerContainer', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		useQueueStore.setState({ queues: {}, next: mockNext });
		usePlayerStore.setState({ currentTrack: null, playbackState: 'idle', isModalOpen: false });
		testSessionStore.setState({
			user: { id: 'me' } as UserProfile,
			accessToken: 'test-token',
			isAuthenticated: true,
		});
		useConnectStore.setState({
			target: { kind: 'local' },
			remoteStatus: null,
			controlPending: false,
		});
	});

	it('shows "Rien en lecture" without a track and opens the modal on tap', () => {
		render(<MiniPlayerContainer />);
		expect(screen.getByText('Rien en lecture')).toBeTruthy();
		expect(screen.getByText('Choisissez un titre pour commencer')).toBeTruthy();
		fireEvent.press(screen.getByText('Rien en lecture'));
		expect(usePlayerStore.getState().isModalOpen).toBe(true);
	});

	it('disables play and next without a track', () => {
		const resume = jest.fn();
		usePlayerStore.setState({ resume });
		render(<MiniPlayerContainer />);
		expect(screen.getByLabelText('Lecture')).toBeDisabled();
		expect(screen.getByLabelText('Piste suivante')).toBeDisabled();
		fireEvent.press(screen.getByLabelText('Lecture'));
		fireEvent.press(screen.getByLabelText('Piste suivante'));
		expect(resume).not.toHaveBeenCalled();
		expect(mockNext).not.toHaveBeenCalled();
		expect(hapticTap).not.toHaveBeenCalled();
	});

	it('opens the modal from the labelled info area', () => {
		usePlayerStore.setState({ currentTrack: track, playbackState: 'paused' });
		render(<MiniPlayerContainer />);
		const info = screen.getByLabelText('Ouvrir le lecteur, Tapped, x');
		expect(info.props.accessibilityRole).toBe('button');
		fireEvent.press(info);
		expect(usePlayerStore.getState().isModalOpen).toBe(true);
	});

	it('wraps its buttons in a frame that is no button, so the web nests no <button>', () => {
		render(<MiniPlayerContainer />);
		const frame = screen.getByLabelText('Mini-lecteur', { includeHiddenElements: true });
		expect(frame.props.accessibilityRole).toBe('none');
	});

	it('shows the track, then the empty state again after stop', () => {
		usePlayerStore.setState({ currentTrack: track, playbackState: 'paused' });
		render(<MiniPlayerContainer />);
		expect(screen.getByText(track.title)).toBeTruthy();
		act(() => usePlayerStore.getState().stop());
		expect(screen.getByText('Rien en lecture')).toBeTruthy();
	});

	describe('in remote mode', () => {
		function remoteStatus(ownerId: string) {
			return {
				ownerId,
				device: { deviceId: 'tablet', deviceName: 'Tablette', platform: 'android', model: 'Tab' },
				track: { id: 5, title: 'Sur la tablette', artist: 'Léa', artworkUrl: null },
				isPlaying: true,
				positionMs: 0,
				updatedAt: new Date().toISOString(),
			};
		}

		it("shows the friend's device track and « Sur Tablette de Léa »", () => {
			useConnectStore.setState({
				target: { kind: 'remote', ownerId: 'friend', deviceId: 'tablet', ownerUsername: 'Léa' },
				remoteStatus: remoteStatus('friend'),
				controlPending: false,
			});
			render(<MiniPlayerContainer />);
			expect(screen.getByText('Sur la tablette')).toBeTruthy();
			expect(screen.getByText('Sur Tablette de Léa')).toBeTruthy();
			expect(screen.getByLabelText('Pause')).not.toBeDisabled();
		});

		it('shows « Sur Tablette » for one of my devices', () => {
			useConnectStore.setState({
				target: { kind: 'remote', ownerId: 'me', deviceId: 'tablet' },
				remoteStatus: remoteStatus('me'),
				controlPending: false,
			});
			render(<MiniPlayerContainer />);
			expect(screen.getByText('Sur Tablette')).toBeTruthy();
		});

		it('shows no device line in local mode', () => {
			usePlayerStore.setState({ currentTrack: track, playbackState: 'paused' });
			render(<MiniPlayerContainer />);
			expect(screen.queryByText(/^Sur /u)).toBeNull();
		});
	});
});
