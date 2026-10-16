import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import type { PanGesture } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { MiniPlayer } from '@/components/player/MiniPlayer';
import { usePlayerStore } from '@/store/playerStore';
import type { NowPlaying } from '@/hooks/useNowPlaying';
import { hapticTap } from '@/utils/haptics';

jest.mock('@/utils/haptics', () => ({
	hapticTap: jest.fn(),
	hapticSelection: jest.fn(),
	hapticSuccess: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/lib/supabase', () => ({
	supabase: { auth: { signOut: jest.fn(), setSession: jest.fn() } },
}));

jest.mock('@services/oauth', () => ({
	signInWithGoogle: jest.fn(),
	signInWithFacebook: jest.fn(),
}));

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('@/contexts/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@themes/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

let mockNowPlaying: NowPlaying;
jest.mock('@/hooks/useNowPlaying', () => ({
	useNowPlaying: () => mockNowPlaying,
}));

function nowPlaying(overrides: Partial<NowPlaying> = {}): NowPlaying {
	return {
		isRemote: false,
		track: { id: 1, title: 'Song', artist: 'Artist', artworkUrl: null },
		isPlaying: true,
		isLoading: false,
		canToggle: true,
		positionMs: 1000,
		durationMs: 200_000,
		deviceLabel: null,
		toggle: jest.fn(),
		next: jest.fn(),
		previous: jest.fn(),
		hasNext: true,
		hasPrevious: true,
		...overrides,
	};
}

const swipe = (translationX: number, translationY = 0, velocityX = 0) =>
	act(() =>
		fireGestureHandler<PanGesture>(getByGestureTestId('mini-player-pan'), [
			{ state: State.BEGAN, translationX: 0, translationY: 0 },
			{ state: State.ACTIVE, translationX: translationX / 2, translationY: translationY / 2 },
			{ state: State.ACTIVE, translationX, translationY },
			{ state: State.END, translationX, translationY, velocityX },
		])
	);

describe('MiniPlayer gestures (#311)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockNowPlaying = nowPlaying();
		usePlayerStore.setState({ isModalOpen: false });
	});

	it('swipes left to the next track', () => {
		render(<MiniPlayer />);
		swipe(-150);
		expect(mockNowPlaying.next).toHaveBeenCalledTimes(1);
		expect(mockNowPlaying.previous).not.toHaveBeenCalled();
		expect(hapticTap).toHaveBeenCalledTimes(1);
	});

	it('swipes right to the previous track', () => {
		render(<MiniPlayer />);
		swipe(150);
		expect(mockNowPlaying.previous).toHaveBeenCalledTimes(1);
		expect(mockNowPlaying.next).not.toHaveBeenCalled();
		expect(hapticTap).toHaveBeenCalledTimes(1);
	});

	it('springs back under the threshold', () => {
		render(<MiniPlayer />);
		swipe(-40);
		swipe(40);
		expect(mockNowPlaying.next).not.toHaveBeenCalled();
		expect(mockNowPlaying.previous).not.toHaveBeenCalled();
		expect(hapticTap).not.toHaveBeenCalled();
	});

	it('changes the track on a quick flick under the distance threshold', () => {
		render(<MiniPlayer />);
		swipe(-40, 0, -1200);
		expect(mockNowPlaying.next).toHaveBeenCalledTimes(1);
	});

	it('does nothing without a next track', () => {
		mockNowPlaying = nowPlaying({ hasNext: false });
		render(<MiniPlayer />);
		swipe(-150);
		expect(mockNowPlaying.next).not.toHaveBeenCalled();
		expect(hapticTap).not.toHaveBeenCalled();
	});

	it('restarts the track with a right swipe past a few seconds, with no previous item', () => {
		mockNowPlaying = nowPlaying({ hasPrevious: false, positionMs: 10_000 });
		render(<MiniPlayer />);
		swipe(150);
		expect(mockNowPlaying.previous).toHaveBeenCalledTimes(1);
	});

	it('does nothing on a right swipe in remote mode without a previous item', () => {
		mockNowPlaying = nowPlaying({ isRemote: true, hasPrevious: false, positionMs: 10_000 });
		render(<MiniPlayer />);
		swipe(150);
		expect(mockNowPlaying.previous).not.toHaveBeenCalled();
	});

	it('swipes up to open the player modal', () => {
		render(<MiniPlayer />);
		swipe(0, -80);
		expect(usePlayerStore.getState().isModalOpen).toBe(true);
		expect(mockNowPlaying.next).not.toHaveBeenCalled();
		expect(hapticTap).not.toHaveBeenCalled();
	});

	it('keeps the tap and the play button working', () => {
		render(<MiniPlayer />);
		fireEvent.press(screen.getByLabelText('Pause'));
		expect(mockNowPlaying.toggle).toHaveBeenCalledTimes(1);
		expect(hapticTap).toHaveBeenCalledTimes(1);
		fireEvent.press(screen.getByText('Song'));
		expect(usePlayerStore.getState().isModalOpen).toBe(true);
	});

	it('taps once on the next button', () => {
		render(<MiniPlayer />);
		fireEvent.press(screen.getByLabelText('Piste suivante'));
		expect(mockNowPlaying.next).toHaveBeenCalledTimes(1);
		expect(hapticTap).toHaveBeenCalledTimes(1);
	});

	it('does not vibrate when the toggle is not allowed', () => {
		mockNowPlaying = nowPlaying({ canToggle: false });
		render(<MiniPlayer />);
		fireEvent.press(screen.getByLabelText('Pause'));
		expect(mockNowPlaying.toggle).not.toHaveBeenCalled();
		expect(hapticTap).not.toHaveBeenCalled();
	});

	it('only activates on a real drag, so taps reach the buttons', () => {
		render(<MiniPlayer />);
		const { config } = getByGestureTestId('mini-player-pan') as PanGesture;
		expect(config).toMatchObject({
			activeOffsetXStart: -15,
			activeOffsetXEnd: 15,
			activeOffsetYStart: -15,
		});
	});
});
