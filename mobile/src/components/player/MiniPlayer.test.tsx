import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { MiniPlayer } from '@/components/player/MiniPlayer';
import { usePlayerStore } from '@/store/playerStore';
import { queueApi } from '@/services/queueApi';
import type { SoundCloudTrack } from '@/types/soundcloud.types';

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
		expect(screen.getByLabelText('Play')).toBeDisabled();
		expect(screen.getByLabelText('Next track')).toBeDisabled();
		fireEvent.press(screen.getByLabelText('Play'));
		fireEvent.press(screen.getByLabelText('Next track'));
		expect(resume).not.toHaveBeenCalled();
		expect(queueApi.next).not.toHaveBeenCalled();
	});

	it('shows the track, then the empty state again after stop', () => {
		usePlayerStore.setState({ currentTrack: track, playbackState: 'paused' });
		render(<MiniPlayer />);
		expect(screen.getByText(track.title)).toBeTruthy();
		act(() => usePlayerStore.getState().stop());
		expect(screen.getByText('Rien en lecture')).toBeTruthy();
	});
});
