import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { PlayerModal } from '@/components/player/PlayerModal';
import { usePlayerStore } from '@/store/playerStore';
import { useConnectStore } from '@/store/connectStore';
import { useQueueStore } from '@/store/queueStore';
import { useAuthStore } from '@/store/authStore';
import { hashStringToNumber } from '@utils/trackToSoundCloud';
import type { UserProfile } from '@/types/user.types';
import { useImageColors } from '@/hooks/useImageColors';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { State } from 'react-native-gesture-handler';
import type { PanGesture } from 'react-native-gesture-handler';
import type { SoundCloudTrack } from '@/types/soundcloud.types';
import { hapticTap } from '@/utils/haptics';

jest.mock('@/utils/haptics', () => ({
	hapticTap: jest.fn(),
	hapticSelection: jest.fn(),
	hapticSuccess: jest.fn(),
}));

const mockSeekTo = jest.fn();
const mockProgress = { progress: 0, currentTime: 0, duration: 0 };

jest.mock('@services/oauth', () => ({
	signInWithGoogle: jest.fn(),
	signInWithFacebook: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@themes/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('react-native-gesture-handler', () => ({
	...jest.requireActual('react-native-gesture-handler'),
	GestureHandlerRootView: jest.requireActual('react-native').View,
}));

jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
	deviceService: { getDeviceInfo: jest.fn(async () => ({ deviceId: 'phone' })) },
}));

jest.mock('@/services/musicControlApi', () => ({
	musicControlApi: {
		getDevicePicker: jest.fn(async () => ({
			owners: [
				{
					ownerId: 'me',
					username: 'moi',
					isSelf: true,
					devices: [
						{
							deviceId: 'phone',
							deviceName: 'Mon téléphone',
							platform: 'android',
							model: 'Pixel',
							lastSeenAt: '2026-10-15T00:00:00Z',
							access: 'all-devices',
							online: true,
						},
					],
				},
			],
		})),
	},
}));

jest.mock('@/services/queueApi', () => ({
	queueApi: {
		getQueue: jest.fn(),
		next: jest.fn(),
		previous: jest.fn(),
		playItem: jest.fn(),
		moveItem: jest.fn(),
		removeItem: jest.fn(),
		transfer: jest.fn(),
	},
}));

jest.mock('@/contexts/PlayerContext', () => ({
	usePlayer: () => ({ player: { playing: false }, error: null, seekTo: mockSeekTo }),
}));

jest.mock('@/hooks/usePlayerProgress', () => ({
	usePlayerProgress: () => mockProgress,
}));

jest.mock('@/hooks/useImageColors', () => ({
	useImageColors: jest.fn(() => ({ dominantColor: null })),
	hexToRgba: (color: string) => color,
	getAdaptiveColors: () => null,
}));

jest.mock('expo-linear-gradient', () => ({
	LinearGradient: jest.requireActual('react-native').View,
}));

jest.mock('@react-native-community/slider', () => {
	const { View } = jest.requireActual('react-native');
	return {
		__esModule: true,
		default: (props: Record<string, unknown>) => <View testID="seek-slider" {...props} />,
	};
});

// The library needs native drag: render the header and empty state plainly.
jest.mock('react-native-reorderable-list', () => {
	const { View } = jest.requireActual('react-native');
	return {
		__esModule: true,
		default: (props: {
			ListHeaderComponent?: React.ReactElement;
			ListEmptyComponent?: React.ReactElement;
		}) => (
			<View>
				{props.ListHeaderComponent}
				{props.ListEmptyComponent}
			</View>
		),
		reorderItems: <T,>(data: T[]) => data,
		useReorderableDrag: () => jest.fn(),
		useIsActive: () => false,
	};
});

jest.mock('react-native-reanimated', () => jest.requireActual('react-native-reanimated/mock'));

describe('PlayerModal without a track', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		useConnectStore.setState({ target: { kind: 'local' }, remoteStatus: null });
		usePlayerStore.setState({ currentTrack: null, playbackState: 'idle', isModalOpen: true });
	});

	it('renders the empty state with disabled controls', () => {
		render(<PlayerModal />);
		expect(screen.getByText('Rien en lecture')).toBeTruthy();
		expect(screen.getByText('Choisissez un titre pour commencer')).toBeTruthy();
		expect(screen.getByTestId('seek-slider', { includeHiddenElements: true }).props.disabled).toBe(
			true
		);
		for (const label of ['Piste précédente', 'Lecture', 'Piste suivante']) {
			expect(screen.getByLabelText(label)).toBeDisabled();
			expect(screen.getByLabelText(label).props.accessibilityRole).toBe('button');
		}
	});

	it('closes from the labelled close button', () => {
		render(<PlayerModal />);
		const close = screen.getByLabelText('Fermer le lecteur');
		expect(close.props.accessibilityRole).toBe('button');
		fireEvent.press(close);
		expect(usePlayerStore.getState().isModalOpen).toBe(false);
	});

	it('keeps the queue button working', () => {
		render(<PlayerModal />);
		fireEvent.press(screen.getByLabelText("File d'attente"));
		expect(screen.getByText("File d'attente")).toBeTruthy();
	});

	it('opens the device picker', async () => {
		render(<PlayerModal />);
		fireEvent.press(screen.getByLabelText("Choisir l'appareil"));
		expect(screen.getByText('Choisir un appareil')).toBeTruthy();
		expect(await screen.findByText('Mon téléphone')).toBeTruthy();
	});

	it('asks for no artwork colors', () => {
		render(<PlayerModal />);
		expect(useImageColors).toHaveBeenCalledWith(null, expect.anything());
	});
});

describe('PlayerModal swipe down', () => {
	const swipe = (translationY: number, velocityY = 0) =>
		act(() =>
			fireGestureHandler<PanGesture>(getByGestureTestId('player-modal-pan'), [
				{ state: State.BEGAN, translationY: 0 },
				{ state: State.ACTIVE, translationY: translationY / 2 },
				{ state: State.ACTIVE, translationY },
				{ state: State.END, translationY, velocityY },
			])
		);

	beforeEach(() => {
		jest.clearAllMocks();
		useConnectStore.setState({ target: { kind: 'local' }, remoteStatus: null });
		usePlayerStore.setState({ currentTrack: null, playbackState: 'idle', isModalOpen: true });
	});

	it('closes the modal past the threshold', () => {
		render(<PlayerModal />);
		swipe(400);
		expect(usePlayerStore.getState().isModalOpen).toBe(false);
	});

	it('closes the modal on a quick flick', () => {
		render(<PlayerModal />);
		swipe(40, 1200);
		expect(usePlayerStore.getState().isModalOpen).toBe(false);
	});

	// fireGestureHandler skips activation rules: check them on the gesture itself.
	it('starts on a downward drag only and gives way to horizontal moves', () => {
		render(<PlayerModal />);
		const { config } = getByGestureTestId('player-modal-pan') as PanGesture;
		expect(config).toMatchObject({
			activeOffsetYEnd: 10,
			failOffsetXStart: -15,
			failOffsetXEnd: 15,
		});
		expect(config.activeOffsetYStart).toBeUndefined();
	});

	it('keeps the modal open under the threshold', () => {
		render(<PlayerModal />);
		swipe(40);
		expect(usePlayerStore.getState().isModalOpen).toBe(true);
	});
});

describe('PlayerModal slider for a screen reader', () => {
	const track: SoundCloudTrack = {
		id: 7,
		title: 'Local song',
		description: null,
		duration: 200_000,
		genre: null,
		artwork_url: null,
		permalink_url: 'https://soundcloud.com/artist/local',
		user: { id: 1, username: 'x', avatar_url: null, permalink_url: '' },
		playable: true,
	};
	// The accessible wrapper, not the mocked slider: the real RN View path.
	const seekControl = () => screen.getByRole('adjustable', { name: 'Position de lecture' });
	const action = (actionName: string) =>
		fireEvent(seekControl(), 'accessibilityAction', {
			nativeEvent: { actionName },
		});

	beforeEach(() => {
		jest.clearAllMocks();
		useConnectStore.setState({ target: { kind: 'local' }, remoteStatus: null });
		usePlayerStore.setState({ currentTrack: track, playbackState: 'playing', isModalOpen: true });
		Object.assign(mockProgress, { currentTime: 30, duration: 200 });
	});

	afterAll(() => {
		Object.assign(mockProgress, { currentTime: 0, duration: 0 });
	});

	it('announces the position over the length', () => {
		render(<PlayerModal />);
		expect(seekControl().props.testID).not.toBe('seek-slider');
		expect(
			screen.getByTestId('seek-slider', { includeHiddenElements: true }).props
				.importantForAccessibility
		).toBe('no-hide-descendants');
		expect(seekControl().props.accessibilityValue).toEqual({
			text: '0:30 sur 3:20',
		});
	});

	it('seeks 10 s forward on increment', () => {
		render(<PlayerModal />);
		action('increment');
		expect(mockSeekTo).toHaveBeenCalledWith(40);
	});

	it('clamps a decrement at the start', () => {
		mockProgress.currentTime = 5;
		render(<PlayerModal />);
		action('decrement');
		expect(mockSeekTo).toHaveBeenCalledWith(0);
	});

	it('clamps an increment at the end', () => {
		mockProgress.currentTime = 195;
		render(<PlayerModal />);
		action('increment');
		expect(mockSeekTo).toHaveBeenCalledWith(200);
	});

	it('does not seek in remote mode', () => {
		const trackUri = 'https://soundcloud.com/artist/remote';
		useAuthStore.setState({ user: { id: 'me' } as UserProfile });
		useConnectStore.setState({
			target: { kind: 'remote', ownerId: 'friend', deviceId: 'tablet', ownerUsername: 'Léa' },
		});
		useQueueStore.getState().reset();
		useQueueStore.getState().applyState({
			ownerId: 'friend',
			version: 1,
			currentItemId: 'r',
			items: [
				{
					id: 'r',
					rank: 'r',
					track: {
						trackUri,
						title: 'Remote song',
						artist: 'Léa',
						album: null,
						albumArt: null,
						durationMs: 180_000,
					},
					sourcePlaylistId: null,
					blockId: null,
					blockDetached: false,
				},
			],
		});
		useConnectStore.setState({
			target: { kind: 'remote', ownerId: 'friend', deviceId: 'tablet', ownerUsername: 'Léa' },
			remoteStatus: {
				ownerId: 'friend',
				device: { deviceId: 'tablet', deviceName: 'Tablette', platform: 'android', model: 'Tab' },
				track: {
					id: hashStringToNumber(trackUri),
					title: 'Remote song',
					artist: 'Léa',
					artworkUrl: null,
				},
				isPlaying: true,
				positionMs: 30_000,
				updatedAt: new Date().toISOString(),
			},
		});
		render(<PlayerModal />);
		expect(seekControl().props.accessibilityState).toMatchObject({
			disabled: true,
		});
		action('increment');
		expect(mockSeekTo).not.toHaveBeenCalled();
	});
});

describe('PlayerModal haptics', () => {
	const track: SoundCloudTrack = {
		id: 8,
		title: 'Haptic song',
		description: null,
		duration: 200_000,
		genre: null,
		artwork_url: null,
		permalink_url: 'https://soundcloud.com/artist/haptic',
		user: { id: 1, username: 'x', avatar_url: null, permalink_url: '' },
		playable: true,
	};
	const pause = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		useQueueStore.getState().reset();
		useConnectStore.setState({ target: { kind: 'local' }, remoteStatus: null });
		usePlayerStore.setState({
			currentTrack: track,
			playbackState: 'playing',
			isModalOpen: true,
			pause,
		});
		Object.assign(mockProgress, { currentTime: 30, duration: 200 });
	});

	afterAll(() => {
		Object.assign(mockProgress, { currentTime: 0, duration: 0 });
	});

	it('taps once on play/pause', () => {
		render(<PlayerModal />);
		fireEvent.press(screen.getByLabelText('Pause'));
		expect(pause).toHaveBeenCalledTimes(1);
		expect(hapticTap).toHaveBeenCalledTimes(1);
	});

	it('taps once on previous', () => {
		render(<PlayerModal />);
		fireEvent.press(screen.getByLabelText('Piste précédente'));
		// Past a few seconds, previous restarts the track.
		expect(mockSeekTo).toHaveBeenCalledWith(0);
		expect(hapticTap).toHaveBeenCalledTimes(1);
	});

	it('taps once on an enabled next', () => {
		const next = jest.fn();
		const realNext = useQueueStore.getState().next;
		useAuthStore.setState({ user: { id: 'me' } as UserProfile });
		useQueueStore.setState({ next });
		useQueueStore.getState().applyState({
			ownerId: 'me',
			version: 1,
			currentItemId: 'a',
			items: ['a', 'b'].map(id => ({
				id,
				rank: id,
				track: {
					trackUri: `https://soundcloud.com/artist/${id}`,
					title: id,
					artist: 'x',
					album: null,
					albumArt: null,
					durationMs: 180_000,
				},
				sourcePlaylistId: null,
				blockId: null,
				blockDetached: false,
			})),
		});
		render(<PlayerModal />);
		fireEvent.press(screen.getByLabelText('Piste suivante'));
		useQueueStore.setState({ next: realNext });
		expect(next).toHaveBeenCalledTimes(1);
		expect(hapticTap).toHaveBeenCalledTimes(1);
	});

	it('does not vibrate when the toggle is not allowed', () => {
		usePlayerStore.setState({ playbackState: 'idle' });
		render(<PlayerModal />);
		fireEvent.press(screen.getByLabelText('Lecture'));
		expect(hapticTap).not.toHaveBeenCalled();
	});

	it('does not vibrate on a disabled next', () => {
		render(<PlayerModal />);
		expect(screen.getByLabelText('Piste suivante')).toBeDisabled();
		fireEvent.press(screen.getByLabelText('Piste suivante'));
		expect(hapticTap).not.toHaveBeenCalled();
	});
});

describe('PlayerModal in remote mode', () => {
	const trackUri = 'https://soundcloud.com/artist/b';
	const status = (id: number) => ({
		ownerId: 'friend',
		device: { deviceId: 'tablet', deviceName: 'Tablette', platform: 'android', model: 'Tab' },
		track: { id, title: 'Remote song', artist: 'Léa', artworkUrl: null },
		isPlaying: true,
		positionMs: 30_000,
		updatedAt: new Date().toISOString(),
	});

	beforeEach(() => {
		jest.clearAllMocks();
		useAuthStore.setState({ user: { id: 'me' } as UserProfile });
		useQueueStore.getState().reset();
		usePlayerStore.setState({ currentTrack: null, playbackState: 'idle', isModalOpen: true });
		useConnectStore.setState({
			target: { kind: 'remote', ownerId: 'friend', deviceId: 'tablet', ownerUsername: 'Léa' },
		});
	});

	it("shows the device's track with a read-only seek bar", () => {
		useQueueStore.getState().applyState({
			ownerId: 'friend',
			version: 1,
			currentItemId: 'b',
			items: [
				{
					id: 'b',
					rank: 'b',
					track: {
						trackUri,
						title: 'Remote song',
						artist: 'Léa',
						album: null,
						albumArt: null,
						durationMs: 180_000,
					},
					sourcePlaylistId: null,
					blockId: null,
					blockDetached: false,
				},
			],
		});
		useConnectStore.setState({ remoteStatus: status(hashStringToNumber(trackUri)) });
		render(<PlayerModal />);

		expect(screen.getByText('Remote song')).toBeTruthy();
		expect(screen.getByText('Sur Tablette de Léa')).toBeTruthy();
		expect(screen.getByTestId('seek-slider', { includeHiddenElements: true }).props.disabled).toBe(
			true
		);
		expect(screen.getByText('3:00')).toBeTruthy();
		expect(screen.getByLabelText('Pause')).not.toBeDisabled();
	});

	it('hides the progress bar when the duration is unknown', () => {
		useConnectStore.setState({ remoteStatus: status(1) });
		render(<PlayerModal />);
		expect(screen.queryByTestId('seek-slider', { includeHiddenElements: true })).toBeNull();
	});
});
