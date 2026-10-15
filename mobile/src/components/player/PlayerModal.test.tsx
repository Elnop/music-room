import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PlayerModal } from '@/components/player/PlayerModal';
import { usePlayerStore } from '@/store/playerStore';
import { useConnectStore } from '@/store/connectStore';
import { useQueueStore } from '@/store/queueStore';
import { useAuthStore } from '@/store/authStore';
import { hashStringToNumber } from '@utils/trackToSoundCloud';
import type { UserProfile } from '@/types/user.types';
import { useImageColors } from '@/hooks/useImageColors';

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
	usePlayer: () => ({ player: { playing: false }, error: null }),
}));

jest.mock('@/hooks/usePlayerProgress', () => ({
	usePlayerProgress: () => ({ progress: 0, currentTime: 0, duration: 0 }),
}));

jest.mock('@/hooks/useImageColors', () => ({
	useImageColors: jest.fn(() => ({ dominantColor: null })),
	hexToRgba: (color: string) => color,
	getAdaptiveColors: (color: string) => color,
	isLightColor: () => false,
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
		expect(screen.getByText('Choisis un son pour commencer')).toBeTruthy();
		expect(screen.getByTestId('seek-slider').props.disabled).toBe(true);
		for (const label of ['Previous track', 'Play', 'Next track']) {
			expect(screen.getByLabelText(label)).toBeDisabled();
		}
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
		expect(screen.getByTestId('seek-slider').props.disabled).toBe(true);
		expect(screen.getByText('3:00')).toBeTruthy();
		expect(screen.getByLabelText('Pause')).not.toBeDisabled();
	});

	it('hides the progress bar when the duration is unknown', () => {
		useConnectStore.setState({ remoteStatus: status(1) });
		render(<PlayerModal />);
		expect(screen.queryByTestId('seek-slider')).toBeNull();
	});
});
