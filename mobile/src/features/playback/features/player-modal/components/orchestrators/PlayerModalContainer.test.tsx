import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { createStore } from 'zustand';
import { View } from 'react-native';
import type { PlayerSheets } from '@/features/playback/shared/full-screen-sheet/playerSheetsTypes';
import { PlayerModalContainer } from '@/features/playback/features/player-modal/components/orchestrators/PlayerModalContainer';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import { queueStore } from '@/features/playback/shared/player/stores/queueStore';
import { connectStore } from '@/features/playback/shared/player/stores/connectStore';
import type { OwnerQueue } from '@/features/playback/shared/player/types/queueTypes';
import { registerAuthSession } from '@/shared/backend/lib/authSession';
import type { SessionView } from '@/shared/backend/types/sessionTypes';
import { hashStringToNumber } from '@/features/playback/shared/player/lib/trackToSoundCloud';
import type { UserProfile } from '@/shared/users/userTypes';
import { useImageColors } from '@/shared/image-colors/useImageColors';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { State } from 'react-native-gesture-handler';
import type { PanGesture } from 'react-native-gesture-handler';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import { hapticTap } from '@/shared/theme/lib/haptics';
import { Text } from '@/shared/theme/components/Text';

jest.mock('@/shared/theme/lib/haptics', () => ({
	hapticTap: jest.fn(),
	hapticSelection: jest.fn(),
	hapticSuccess: jest.fn(),
}));

const mockSeekTo = jest.fn();
const mockProgress = { progress: 0, currentTime: 0, duration: 0 };

jest.mock('@/shared/theme/hooks/useTheme', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/configs/originalThemeConfig');
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
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@/shared/backend/deviceService', () => ({
	getAppVersion: () => '1.2.3',
	deviceService: { getDeviceInfo: jest.fn(async () => ({ deviceId: 'phone' })) },
}));

jest.mock('@/features/playback/shared/player/hooks/usePlayer', () => ({
	usePlayer: () => ({ player: { playing: false }, error: null, seekTo: mockSeekTo }),
}));

jest.mock('@/features/playback/shared/player/hooks/usePlayerProgress', () => ({
	usePlayerProgress: () => mockProgress,
}));

jest.mock('@/shared/image-colors/useImageColors', () => ({
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

let mockNext = jest.fn(async () => 'played' as const);
const mockPrevious = jest.fn(async () => 'played' as const);

function activeOwner(): string {
	const { target } = connectStore.getState();
	return target.kind === 'remote' ? target.ownerId : 'me';
}

function setTestQueue(queue: OwnerQueue) {
	queueStore.setState({ queues: { [activeOwner()]: queue } });
}

queueStore.setState({ next: () => mockNext(), previous: () => mockPrevious() });

const sheets: PlayerSheets = {
	QueueModal: ({ visible }) => (visible ? <Text>File d'attente</Text> : null),
	DevicePicker: ({ visible }) =>
		visible ? (
			<View>
				<Text>Choisir un appareil</Text>
				<Text>Mon téléphone</Text>
			</View>
		) : null,
};

describe('PlayerModalContainer without a track', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		connectStore.setState({
			target: { kind: 'local' },
			remoteStatus: null,
			controlPending: false,
		});
		setTestQueue({ currentItemId: null, items: [], version: 0 });
		playerStore.setState({ currentTrack: null, playbackState: 'idle', isModalOpen: true });
	});

	it('renders the empty state with disabled controls', () => {
		render(<PlayerModalContainer {...sheets} />);
		expect(screen.getByText('Rien en lecture')).toBeTruthy();
		expect(screen.getByText('Choisissez un titre pour commencer')).toBeTruthy();
		expect(screen.getByTestId('seek-slider', { includeHiddenElements: true }).props.disabled).toBe(
			true,
		);
		for (const label of ['Piste précédente', 'Lecture', 'Piste suivante']) {
			expect(screen.getByLabelText(label)).toBeDisabled();
			expect(screen.getByLabelText(label).props.accessibilityRole).toBe('button');
		}
	});

	it('closes from the labelled close button', () => {
		render(<PlayerModalContainer {...sheets} />);
		const close = screen.getByLabelText('Fermer le lecteur');
		expect(close.props.accessibilityRole).toBe('button');
		fireEvent.press(close);
		expect(playerStore.getState().isModalOpen).toBe(false);
	});

	it('puts the devices and queue buttons in a row under the playback controls', () => {
		render(<PlayerModalContainer {...sheets} />);
		const tree = JSON.stringify(screen.toJSON());
		function at(label: string) {
			return tree.indexOf(`"accessibilityLabel":"${label}"`);
		}
		expect(at('Fermer le lecteur')).toBeLessThan(at('Piste suivante'));
		expect(at('Piste suivante')).toBeLessThan(at("Choisir l'appareil"));
		expect(at("Choisir l'appareil")).toBeLessThan(at("File d'attente"));
	});

	it('keeps the queue button working', () => {
		render(<PlayerModalContainer {...sheets} />);
		fireEvent.press(screen.getByLabelText("File d'attente"));
		expect(screen.getByText("File d'attente")).toBeTruthy();
	});

	it('opens the device picker', async () => {
		render(<PlayerModalContainer {...sheets} />);
		fireEvent.press(screen.getByLabelText("Choisir l'appareil"));
		expect(screen.getByText('Choisir un appareil')).toBeTruthy();
		expect(await screen.findByText('Mon téléphone')).toBeTruthy();
	});

	it('asks for no artwork colors', () => {
		render(<PlayerModalContainer {...sheets} />);
		expect(useImageColors).toHaveBeenCalledWith(null, expect.anything());
	});
});

describe('PlayerModalContainer swipe down', () => {
	function swipe(translationY: number, velocityY = 0) {
		return act(() =>
			fireGestureHandler<PanGesture>(getByGestureTestId('player-modal-pan'), [
				{ state: State.BEGAN, translationY: 0 },
				{ state: State.ACTIVE, translationY: translationY / 2 },
				{ state: State.ACTIVE, translationY },
				{ state: State.END, translationY, velocityY },
			]),
		);
	}

	beforeEach(() => {
		jest.clearAllMocks();
		connectStore.setState({
			target: { kind: 'local' },
			remoteStatus: null,
			controlPending: false,
		});
		setTestQueue({ currentItemId: null, items: [], version: 0 });
		playerStore.setState({ currentTrack: null, playbackState: 'idle', isModalOpen: true });
	});

	it('closes the modal past the threshold', () => {
		render(<PlayerModalContainer {...sheets} />);
		swipe(400);
		expect(playerStore.getState().isModalOpen).toBe(false);
	});

	it('closes the modal on a quick flick', () => {
		render(<PlayerModalContainer {...sheets} />);
		swipe(40, 1200);
		expect(playerStore.getState().isModalOpen).toBe(false);
	});

	it('starts on a downward drag only and gives way to horizontal moves', () => {
		render(<PlayerModalContainer {...sheets} />);
		const { config } = getByGestureTestId('player-modal-pan') as PanGesture;
		expect(config).toMatchObject({
			activeOffsetYEnd: 10,
			failOffsetXStart: -15,
			failOffsetXEnd: 15,
		});
		expect(config.activeOffsetYStart).toBeUndefined();
	});

	it('keeps the modal open under the threshold', () => {
		render(<PlayerModalContainer {...sheets} />);
		swipe(40);
		expect(playerStore.getState().isModalOpen).toBe(true);
	});
});

describe('PlayerModalContainer slider for a screen reader', () => {
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
	function seekControl() {
		return screen.getByRole('adjustable', { name: 'Position de lecture' });
	}
	function action(actionName: string) {
		return fireEvent(seekControl(), 'accessibilityAction', {
			nativeEvent: { actionName },
		});
	}

	beforeEach(() => {
		jest.clearAllMocks();
		connectStore.setState({
			target: { kind: 'local' },
			remoteStatus: null,
			controlPending: false,
		});
		setTestQueue({ currentItemId: null, items: [], version: 0 });
		playerStore.setState({ currentTrack: track, playbackState: 'playing', isModalOpen: true });
		Object.assign(mockProgress, { currentTime: 30, duration: 200 });
	});

	afterAll(() => {
		Object.assign(mockProgress, { currentTime: 0, duration: 0 });
	});

	it('announces the position over the length', () => {
		render(<PlayerModalContainer {...sheets} />);
		expect(seekControl().props.testID).not.toBe('seek-slider');
		expect(
			screen.getByTestId('seek-slider', { includeHiddenElements: true }).props
				.importantForAccessibility,
		).toBe('no-hide-descendants');
		expect(seekControl().props.accessibilityValue).toStrictEqual({
			text: '0:30 sur 3:20',
		});
	});

	function slider() {
		return screen.getByTestId('seek-slider', { includeHiddenElements: true });
	}

	it('follows the finger while sliding, then holds the released position', () => {
		render(<PlayerModalContainer {...sheets} />);
		act(() => slider().props.onSlidingStart(30));
		act(() => slider().props.onValueChange(120));
		expect(slider().props.value).toBe(120);
		expect(screen.getByText('2:00')).toBeTruthy();

		act(() => slider().props.onSlidingComplete(120));
		expect(mockSeekTo).toHaveBeenCalledWith(120);
		expect(slider().props.value).toBe(120);
	});

	it('keeps the dismiss pan off the seek bar', () => {
		render(<PlayerModalContainer {...sheets} />);
		const pan = getByGestureTestId('player-modal-pan') as PanGesture;
		expect(pan.config.requireToFail).toContain(getByGestureTestId('player-seek-native'));
	});

	it('seeks 10 s forward on increment', () => {
		render(<PlayerModalContainer {...sheets} />);
		action('increment');
		expect(mockSeekTo).toHaveBeenCalledWith(40);
	});

	it('clamps a decrement at the start', () => {
		mockProgress.currentTime = 5;
		render(<PlayerModalContainer {...sheets} />);
		action('decrement');
		expect(mockSeekTo).toHaveBeenCalledWith(0);
	});

	it('clamps an increment at the end', () => {
		mockProgress.currentTime = 195;
		render(<PlayerModalContainer {...sheets} />);
		action('increment');
		expect(mockSeekTo).toHaveBeenCalledWith(200);
	});

	it('does not seek in remote mode', () => {
		const trackUri = 'https://soundcloud.com/artist/remote';
		testSessionStore.setState({ user: { id: 'me' } as UserProfile });
		connectStore.setState({
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
		});
		setTestQueue({
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
		});
		render(<PlayerModalContainer {...sheets} />);
		expect(seekControl().props.accessibilityState).toMatchObject({
			disabled: true,
		});
		action('increment');
		expect(mockSeekTo).not.toHaveBeenCalled();
	});
});

describe('PlayerModalContainer haptics', () => {
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
		setTestQueue({ currentItemId: null, items: [], version: 0 });
		connectStore.setState({
			target: { kind: 'local' },
			remoteStatus: null,
			controlPending: false,
		});
		playerStore.setState({
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
		render(<PlayerModalContainer {...sheets} />);
		fireEvent.press(screen.getByLabelText('Pause'));
		expect(pause).toHaveBeenCalledTimes(1);
		expect(hapticTap).toHaveBeenCalledTimes(1);
	});

	it('taps once on previous', () => {
		render(<PlayerModalContainer {...sheets} />);
		fireEvent.press(screen.getByLabelText('Piste précédente'));
		expect(mockSeekTo).toHaveBeenCalledWith(0);
		expect(hapticTap).toHaveBeenCalledTimes(1);
	});

	it('taps once on an enabled next', () => {
		mockNext = jest.fn(async () => 'played' as const);
		testSessionStore.setState({ user: { id: 'me' } as UserProfile });
		setTestQueue({
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
		});
		render(<PlayerModalContainer {...sheets} />);
		fireEvent.press(screen.getByLabelText('Piste suivante'));
		expect(mockNext).toHaveBeenCalledTimes(1);
		expect(hapticTap).toHaveBeenCalledTimes(1);
	});

	it('does not vibrate when the toggle is not allowed', () => {
		playerStore.setState({ playbackState: 'idle' });
		render(<PlayerModalContainer {...sheets} />);
		fireEvent.press(screen.getByLabelText('Lecture'));
		expect(hapticTap).not.toHaveBeenCalled();
	});

	it('does not vibrate on a disabled next', () => {
		render(<PlayerModalContainer {...sheets} />);
		expect(screen.getByLabelText('Piste suivante')).toBeDisabled();
		fireEvent.press(screen.getByLabelText('Piste suivante'));
		expect(hapticTap).not.toHaveBeenCalled();
	});
});

describe('PlayerModalContainer in remote mode', () => {
	const trackUri = 'https://soundcloud.com/artist/b';
	function status(id: number) {
		return {
			ownerId: 'friend',
			device: { deviceId: 'tablet', deviceName: 'Tablette', platform: 'android', model: 'Tab' },
			track: { id, title: 'Remote song', artist: 'Léa', artworkUrl: null },
			isPlaying: true,
			positionMs: 30_000,
			updatedAt: new Date().toISOString(),
		};
	}

	beforeEach(() => {
		jest.clearAllMocks();
		testSessionStore.setState({ user: { id: 'me' } as UserProfile });
		setTestQueue({ currentItemId: null, items: [], version: 0 });
		playerStore.setState({ currentTrack: null, playbackState: 'idle', isModalOpen: true });
		connectStore.setState({
			target: { kind: 'remote', ownerId: 'friend', deviceId: 'tablet', ownerUsername: 'Léa' },
			remoteStatus: null,
			controlPending: false,
		});
	});

	it("shows the device's track with a read-only seek bar", () => {
		setTestQueue({
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
		});
		connectStore.setState({ remoteStatus: status(hashStringToNumber(trackUri)) });
		render(<PlayerModalContainer {...sheets} />);

		expect(screen.getByText('Remote song')).toBeTruthy();
		expect(screen.getByText('Sur Tablette de Léa')).toBeTruthy();
		expect(screen.getByTestId('seek-slider', { includeHiddenElements: true }).props.disabled).toBe(
			true,
		);
		expect(screen.getByText('3:00')).toBeTruthy();
		expect(screen.getByLabelText('Pause')).not.toBeDisabled();
	});

	it('hides the progress bar when the duration is unknown', () => {
		connectStore.setState({ remoteStatus: status(1) });
		render(<PlayerModalContainer {...sheets} />);
		expect(screen.queryByTestId('seek-slider', { includeHiddenElements: true })).toBeNull();
	});
});

describe('PlayerModalContainer artwork swipe', () => {
	const track: SoundCloudTrack = {
		id: 8,
		title: 'Middle',
		description: null,
		duration: 200_000,
		genre: null,
		artwork_url: null,
		permalink_url: 'https://soundcloud.com/artist/middle',
		user: { id: 1, username: 'x', avatar_url: null, permalink_url: '' },
		playable: true,
	};
	function queueItem(id: string) {
		return {
			id,
			track: {
				trackUri: `https://soundcloud.com/artist/${id}`,
				title: id,
				artist: 'A',
				album: null,
				albumArt: `https://i1.sndcdn.com/${id}-large.jpg`,
				durationMs: 200_000,
			},
			rank: id,
			sourcePlaylistId: null,
			blockId: null,
			blockDetached: false,
		};
	}
	function swipe(translationX: number, velocityX = 0) {
		return act(() =>
			fireGestureHandler<PanGesture>(getByGestureTestId('player-artwork-pan'), [
				{ state: State.BEGAN, translationX: 0, translationY: 0 },
				{ state: State.ACTIVE, translationX: translationX / 2, translationY: 0 },
				{ state: State.END, translationX, translationY: 0, velocityX },
			]),
		);
	}
	function artworks() {
		return screen.getAllByTestId('artwork-image').map((image) => image.props.source.uri);
	}

	beforeEach(() => {
		jest.clearAllMocks();
		connectStore.setState({
			target: { kind: 'local' },
			remoteStatus: null,
			controlPending: false,
		});
		setTestQueue({ currentItemId: 'b', version: 1, items: ['a', 'b', 'c'].map(queueItem) });
		playerStore.setState({ currentTrack: track, playbackState: 'playing', isModalOpen: true });
		Object.assign(mockProgress, { currentTime: 30, duration: 200 });
	});

	afterAll(() => {
		Object.assign(mockProgress, { currentTime: 0, duration: 0 });
	});

	it('shows the current artwork between the previous and next ones', () => {
		render(<PlayerModalContainer {...sheets} />);
		expect(artworks()).toStrictEqual([
			'https://i1.sndcdn.com/a-t500x500.jpg',
			'https://i1.sndcdn.com/b-t500x500.jpg',
			'https://i1.sndcdn.com/c-t500x500.jpg',
		]);
	});

	it('goes to the next track on a left swipe past the threshold', () => {
		render(<PlayerModalContainer {...sheets} />);
		swipe(-120);
		expect(mockNext).toHaveBeenCalledTimes(1);
		expect(mockPrevious).not.toHaveBeenCalled();
	});

	it('goes to the previous item on a right swipe, even 30 s into the track', () => {
		render(<PlayerModalContainer {...sheets} />);
		swipe(120);
		expect(mockPrevious).toHaveBeenCalledTimes(1);
		expect(mockSeekTo).not.toHaveBeenCalled();
	});

	it('changes track on a quick flick', () => {
		render(<PlayerModalContainer {...sheets} />);
		swipe(-30, -1200);
		expect(mockNext).toHaveBeenCalledTimes(1);
	});

	it('stays on the track under the threshold', () => {
		render(<PlayerModalContainer {...sheets} />);
		swipe(-40);
		swipe(40);
		expect(mockNext).not.toHaveBeenCalled();
		expect(mockPrevious).not.toHaveBeenCalled();
	});

	it('stays on the track without a neighbour on that side', () => {
		setTestQueue({ currentItemId: 'c', version: 1, items: ['b', 'c'].map(queueItem) });
		render(<PlayerModalContainer {...sheets} />);
		swipe(-120);
		expect(mockNext).not.toHaveBeenCalled();
		expect(artworks()).toStrictEqual([
			'https://i1.sndcdn.com/b-t500x500.jpg',
			'https://i1.sndcdn.com/c-t500x500.jpg',
		]);
	});

	it('starts on a horizontal drag and gives way to the vertical dismiss', () => {
		render(<PlayerModalContainer {...sheets} />);
		const { config } = getByGestureTestId('player-artwork-pan') as PanGesture;
		expect(config).toMatchObject({
			activeOffsetXStart: -15,
			activeOffsetXEnd: 15,
			failOffsetYStart: -10,
			failOffsetYEnd: 10,
		});
	});
});
