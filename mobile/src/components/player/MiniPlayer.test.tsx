import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { MiniPlayer } from '@/components/player/MiniPlayer';
import { usePlayerStore } from '@/store/playerStore';
import { useConnectStore } from '@/store/connectStore';
import { useAuthStore } from '@/store/authStore';
import type { UserProfile } from '@/types/user.types';
import { queueApi } from '@/services/queueApi';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

jest.mock('@/lib/supabase', () => ({
	supabase: { auth: { signOut: jest.fn(), setSession: jest.fn() } },
}));

jest.mock('@services/oauth', () => ({
	signInWithGoogle: jest.fn(),
	signInWithFacebook: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@themes/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('@/services/queueApi', () => ({
	queueApi: {
		getQueue: jest.fn(),
		next: jest.fn(),
		previous: jest.fn(),
		playItem: jest.fn(),
		moveItem: jest.fn(),
		removeItem: jest.fn(),
	},
}));

jest.mock('@/contexts/PlayerContext', () => ({
	usePlayer: () => ({ player: { playing: false } }),
}));

jest.mock('@/hooks/usePlayerProgress', () => ({
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

describe('MiniPlayer', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		usePlayerStore.setState({ currentTrack: null, playbackState: 'idle', isModalOpen: false });
		useAuthStore.setState({ user: { id: 'me' } as UserProfile });
		useConnectStore.setState({ target: { kind: 'local' }, remoteStatus: null });
	});

	it('shows "Rien en lecture" without a track and opens the modal on tap', () => {
		render(<MiniPlayer />);
		expect(screen.getByText('Rien en lecture')).toBeTruthy();
		expect(screen.getByText('Choisis un son pour commencer')).toBeTruthy();
		fireEvent.press(screen.getByText('Rien en lecture'));
		expect(usePlayerStore.getState().isModalOpen).toBe(true);
	});

	it('disables play and next without a track', () => {
		const resume = jest.fn();
		usePlayerStore.setState({ resume });
		render(<MiniPlayer />);
		expect(screen.getByLabelText('Lecture')).toBeDisabled();
		expect(screen.getByLabelText('Piste suivante')).toBeDisabled();
		fireEvent.press(screen.getByLabelText('Lecture'));
		fireEvent.press(screen.getByLabelText('Piste suivante'));
		expect(resume).not.toHaveBeenCalled();
		expect(queueApi.next).not.toHaveBeenCalled();
	});

	it('opens the modal from the labelled info area', () => {
		usePlayerStore.setState({ currentTrack: track, playbackState: 'paused' });
		render(<MiniPlayer />);
		const info = screen.getByLabelText('Ouvrir le lecteur, Tapped, x');
		expect(info.props.accessibilityRole).toBe('button');
		fireEvent.press(info);
		expect(usePlayerStore.getState().isModalOpen).toBe(true);
	});

	it('shows the track, then the empty state again after stop', () => {
		usePlayerStore.setState({ currentTrack: track, playbackState: 'paused' });
		render(<MiniPlayer />);
		expect(screen.getByText(track.title)).toBeTruthy();
		act(() => usePlayerStore.getState().stop());
		expect(screen.getByText('Rien en lecture')).toBeTruthy();
	});

	describe('in remote mode', () => {
		const remoteStatus = (ownerId: string) => ({
			ownerId,
			device: { deviceId: 'tablet', deviceName: 'Tablette', platform: 'android', model: 'Tab' },
			track: { id: 5, title: 'Sur la tablette', artist: 'Léa', artworkUrl: null },
			isPlaying: true,
			positionMs: 0,
			updatedAt: new Date().toISOString(),
		});

		it("shows the friend's device track and « Sur Tablette de Léa »", () => {
			useConnectStore.setState({
				target: { kind: 'remote', ownerId: 'friend', deviceId: 'tablet', ownerUsername: 'Léa' },
				remoteStatus: remoteStatus('friend'),
			});
			render(<MiniPlayer />);
			expect(screen.getByText('Sur la tablette')).toBeTruthy();
			expect(screen.getByText('Sur Tablette de Léa')).toBeTruthy();
			expect(screen.getByLabelText('Pause')).not.toBeDisabled();
		});

		it('shows « Sur Tablette » for one of my devices', () => {
			useConnectStore.setState({
				target: { kind: 'remote', ownerId: 'me', deviceId: 'tablet' },
				remoteStatus: remoteStatus('me'),
			});
			render(<MiniPlayer />);
			expect(screen.getByText('Sur Tablette')).toBeTruthy();
		});

		it('shows no device line in local mode', () => {
			usePlayerStore.setState({ currentTrack: track, playbackState: 'paused' });
			render(<MiniPlayer />);
			expect(screen.queryByText(/^Sur /)).toBeNull();
		});
	});
});
