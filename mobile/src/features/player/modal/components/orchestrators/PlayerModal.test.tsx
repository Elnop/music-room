import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createStore } from 'zustand';
import { Text, View } from 'react-native';
import { registerPlayerModals } from '@/shared/services/playerModalsBridge';
import { PlayerModal } from './PlayerModal';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { registerPlaybackBridge, type OwnerQueue } from '@/shared/services/playbackBridge';
import { registerConnectBridge, type ConnectSnapshot } from '@/shared/services/connectBridge';
import { registerAuthSession, type SessionView } from '@/shared/services/authSession';
import { hashStringToNumber } from '@/shared/utils/trackToSoundCloud';
import type { UserProfile } from '@/types/user.types';
import { useImageColors } from '@/shared/hooks/useImageColors';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { State } from 'react-native-gesture-handler';
import type { PanGesture } from 'react-native-gesture-handler';
import type { SoundCloudTrack } from '@/types/soundcloud.types';
import { hapticTap } from '@/shared/utils/haptics';

jest.mock('@/shared/utils/haptics', () => ({
	hapticTap: jest.fn(),
	hapticSelection: jest.fn(),
	hapticSuccess: jest.fn(),
}));

const mockSeekTo = jest.fn();
const mockProgress = { progress: 0, currentTime: 0, duration: 0 };

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
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

jest.mock('@/shared/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
	deviceService: { getDeviceInfo: jest.fn(async () => ({ deviceId: 'phone' })) },
}));

jest.mock('@/shared/services/musicControlBridge', () => ({
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
}));

jest.mock('@/features/player/context/PlayerContext', () => ({
	usePlayer: () => ({ player: { playing: false }, error: null, seekTo: mockSeekTo }),
}));

jest.mock('@/features/player/hooks/usePlayerProgress', () => ({
	usePlayerProgress: () => mockProgress,
}));

jest.mock('@/shared/hooks/useImageColors', () => ({
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

let testQueue: OwnerQueue = {
	currentItemId: null,
	items: [],
	version: 0,
};

let testConnectState: ConnectSnapshot = {
	target: { kind: 'local' },
	remoteStatus: null,
	controlPending: false,
};

let mockNext = jest.fn(async () => 'played' as const);

registerPlaybackBridge({
	usePlaylistPlayback: () => ({ playingUri: null, state: null }),
	usePlayerHeight: () => 0,
	useActiveQueue: () => testQueue,
	addToQueue: jest.fn(async () => true),
	playNext: jest.fn(async () => true),
	playPlaylist: jest.fn(async () => 'ok'),
	next: () => mockNext(),
	previous: jest.fn(async () => 'played'),
	playListTrack: jest.fn(async () => undefined),
	playTrack: jest.fn(),
	pause: jest.fn(),
	resume: jest.fn(),
	stop: jest.fn(),
	getPlayerState: () => ({ currentTrack: null, queueItemId: null, loadCounter: 0, positionMs: 0 }),
});

registerConnectBridge({
	useConnect: selector => selector(testConnectState),
	useIsLocal: () => testConnectState.target.kind === 'local',
	getConnectState: () => testConnectState,
	setRemoteStatus: status => {
		testConnectState.remoteStatus = status;
	},
	setControlPending: pending => {
		testConnectState.controlPending = pending;
	},
	setLocal: () => {
		testConnectState.target = { kind: 'local' };
	},
	setRemote: target => {
		testConnectState.target = { kind: 'remote', ...target };
	},
});

describe('PlayerModal without a track', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		registerPlayerModals({
			QueueModal: ({ visible }) => (visible ? <Text>File d'attente</Text> : null),
			DevicePickerSheet: ({ visible }) =>
				visible ? (
					<View>
						<Text>Choisir un appareil</Text>
						<Text>Mon téléphone</Text>
					</View>
				) : null,
		});
		testConnectState = { target: { kind: 'local' }, remoteStatus: null, controlPending: false };
		testQueue = { currentItemId: null, items: [], version: 0 };
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

	it('puts the devices and queue buttons in a row under the playback controls', () => {
		render(<PlayerModal />);
		const tree = JSON.stringify(screen.toJSON());
		const at = (label: string) => tree.indexOf(`"accessibilityLabel":"${label}"`);
		expect(at('Fermer le lecteur')).toBeLessThan(at('Piste suivante'));
		expect(at('Piste suivante')).toBeLessThan(at("Choisir l'appareil"));
		expect(at("Choisir l'appareil")).toBeLessThan(at("File d'attente"));
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
		registerPlayerModals({
			QueueModal: ({ visible }) => (visible ? <Text>File d'attente</Text> : null),
			DevicePickerSheet: ({ visible }) =>
				visible ? (
					<View>
						<Text>Choisir un appareil</Text>
						<Text>Mon téléphone</Text>
					</View>
				) : null,
		});
		testConnectState = { target: { kind: 'local' }, remoteStatus: null, controlPending: false };
		testQueue = { currentItemId: null, items: [], version: 0 };
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
		registerPlayerModals({
			QueueModal: ({ visible }) => (visible ? <Text>File d'attente</Text> : null),
			DevicePickerSheet: ({ visible }) =>
				visible ? (
					<View>
						<Text>Choisir un appareil</Text>
						<Text>Mon téléphone</Text>
					</View>
				) : null,
		});
		testConnectState = { target: { kind: 'local' }, remoteStatus: null, controlPending: false };
		testQueue = { currentItemId: null, items: [], version: 0 };
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

	const slider = () => screen.getByTestId('seek-slider', { includeHiddenElements: true });

	it('follows the finger while sliding, then holds the released position', () => {
		render(<PlayerModal />);
		act(() => slider().props.onSlidingStart(30));
		act(() => slider().props.onValueChange(120));
		expect(slider().props.value).toBe(120);
		expect(screen.getByText('2:00')).toBeTruthy();

		act(() => slider().props.onSlidingComplete(120));
		expect(mockSeekTo).toHaveBeenCalledWith(120);
		// The player still reports 0:30: the thumb must not jump back.
		expect(slider().props.value).toBe(120);
	});

	it('keeps the dismiss pan off the seek bar', () => {
		render(<PlayerModal />);
		const pan = getByGestureTestId('player-modal-pan') as PanGesture;
		expect(pan.config.requireToFail).toContain(getByGestureTestId('player-seek-native'));
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
		testSessionStore.setState({ user: { id: 'me' } as UserProfile });
		testConnectState = {
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
			controlPending: false,
		};
		testQueue = {
			currentItemId: 'r',
			version: 1,
			items: [
				{
					id: 'r',
					track: {
						trackUri,
						title: 'Remote song',
						artist: 'Léa',
						album: null,
						albumArt: null,
						durationMs: 180_000,
					},
					rank: '0',
					sourcePlaylistId: null,
					blockId: null,
					blockDetached: false,
				},
			],
		};
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
		testQueue = { currentItemId: null, items: [], version: 0 };
		testConnectState = { target: { kind: 'local' }, remoteStatus: null, controlPending: false };
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
		mockNext = jest.fn(async () => 'played' as const);
		testSessionStore.setState({ user: { id: 'me' } as UserProfile });
		testQueue = {
			version: 1,
			currentItemId: 'a',
			items: ['a', 'b'].map((id, index) => ({
				id,
				track: {
					trackUri: `https://soundcloud.com/artist/${id}`,
					title: id,
					artist: 'x',
					album: null,
					albumArt: null,
					durationMs: 180_000,
				},
				rank: String(index),
				sourcePlaylistId: null,
				blockId: null,
				blockDetached: false,
			})),
		};
		render(<PlayerModal />);
		fireEvent.press(screen.getByLabelText('Piste suivante'));
		expect(mockNext).toHaveBeenCalledTimes(1);
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
		testSessionStore.setState({ user: { id: 'me' } as UserProfile });
		testQueue = { currentItemId: null, items: [], version: 0 };
		usePlayerStore.setState({ currentTrack: null, playbackState: 'idle', isModalOpen: true });
		testConnectState = {
			target: { kind: 'remote', ownerId: 'friend', deviceId: 'tablet', ownerUsername: 'Léa' },
			remoteStatus: null,
			controlPending: false,
		};
	});

	it("shows the device's track with a read-only seek bar", () => {
		testQueue = {
			version: 1,
			currentItemId: 'b',
			items: [
				{
					id: 'b',
					track: {
						trackUri,
						title: 'Remote song',
						artist: 'Léa',
						album: null,
						albumArt: null,
						durationMs: 180_000,
					},
					rank: '0',
					sourcePlaylistId: null,
					blockId: null,
					blockDetached: false,
				},
			],
		};
		testConnectState.remoteStatus = status(hashStringToNumber(trackUri));
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
		testConnectState.remoteStatus = status(1);
		render(<PlayerModal />);
		expect(screen.queryByTestId('seek-slider', { includeHiddenElements: true })).toBeNull();
	});
});
