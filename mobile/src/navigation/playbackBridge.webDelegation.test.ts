import { act, renderHook } from '@testing-library/react-native';
import type { AlertButton } from 'react-native';
import { usePlayerAudio } from '@/features/player/hooks/usePlayerAudio';
import { useAutoplayPrompt } from '@/features/player/hooks/useAutoplayPrompt';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { useAutoplayStore } from '@/features/player/stores/autoplayStore';
import { useMusicControlEmitter } from '@/features/music-control/hooks/useMusicControlEmitter';
import { showAlert } from '@/shared/utils/alert';
import type { DeviceCommand } from '@/types/queue.types';
import { FakeMediaElement, autoplayRefusal, installFakeDocument } from '@/test/fakeMediaElement';
import { registerPlayback } from './playbackBridge';

// The browser as a delegated device: a friend's commands drive the web player, and the status it sends back is true.

jest.mock('@/features/player/services/audioPlayer', () =>
	jest.requireActual('@/features/player/services/audioPlayer.web')
);
jest.mock('hls.js', () => ({ __esModule: true, default: { isSupported: () => false } }));
jest.mock('@/features/player/services/streamApi', () => ({
	fetchStreamUrl: () =>
		Promise.resolve({ streamUrl: 'https://cdn/stream.m3u8', expiresAt: Date.now() + 1_800_000 }),
}));
jest.mock('@/shared/utils/alert', () => ({ showAlert: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockSocket = { connected: true, on: jest.fn(), off: jest.fn(), emit: jest.fn() };
const mockSession = { user: { id: 'owner' }, accessToken: 'token', isAuthenticated: true };

jest.mock('@/shared/stores/socketStore', () => ({
	useSocketStore: (selector: (state: object) => unknown) =>
		selector({ socket: mockSocket, isConnected: true }),
}));
jest.mock('@/shared/services/authSession', () => ({
	useSession: (selector: (state: object) => unknown) => selector(mockSession),
	getSession: () => mockSession,
	onSessionEnd: () => () => undefined,
}));
jest.mock('@/shared/services/deviceService', () => ({
	deviceService: {
		getDeviceInfo: () =>
			Promise.resolve({
				deviceId: 'web-1',
				deviceName: 'Chrome',
				platform: 'web',
				model: 'Chrome',
			}),
	},
	getAppVersion: () => '1.0.0',
}));

const media = new FakeMediaElement();
installFakeDocument(media);
media.nativeHls = 'maybe';

const command = (data: DeviceCommand | { action: 'play'; fromUserId: string }) => {
	const call = mockSocket.on.mock.calls.find(([event]) => event === 'control:command');
	return act(async () => (call![1] as (payload: typeof data) => void)(data));
};

const playTrack: DeviceCommand = {
	action: 'play-track',
	fromUserId: 'friend',
	positionMs: 0,
	track: {
		trackUri: 'https://soundcloud.com/a/song',
		title: 'Song',
		artist: 'Artist',
		album: null,
		albumArt: null,
		durationMs: 180_000,
	},
};

const sentStatuses = () =>
	mockSocket.emit.mock.calls
		.filter(([event]) => event === 'listening:update')
		.map(([, status]) => status as { track: { title: string } | null; isPlaying: boolean });

async function settle(ms = 500) {
	for (let elapsed = 0; elapsed < ms; elapsed += 50) {
		await act(async () => {
			jest.advanceTimersByTime(50);
			await Promise.resolve();
		});
	}
}

function useWebDevice() {
	const { player } = usePlayerAudio();
	useAutoplayPrompt(player);
	useMusicControlEmitter();
}

async function receiveTrack() {
	await command(playTrack);
	await settle(50);
	act(() => media.loadStream(180));
	await settle();
}

beforeAll(() => registerPlayback());

beforeEach(() => {
	jest.useFakeTimers();
	jest.clearAllMocks();
	Object.assign(media, { paused: true, ended: false, readyState: 0, duration: NaN });
	media.playResult = () => Promise.resolve();
	usePlayerStore.setState(usePlayerStore.getInitialState());
	useAutoplayStore.setState({ blocked: false });
});

afterEach(() => jest.useRealTimers());

describe('the browser as a delegated device', () => {
	it('plays, pauses, and resumes on remote commands, and reports it', async () => {
		const { unmount } = renderHook(() => useWebDevice());
		await settle();

		await receiveTrack();
		expect(media.src).toBe('https://cdn/stream.m3u8');
		expect(media.paused).toBe(false);
		expect(sentStatuses().at(-1)).toMatchObject({ track: { title: 'Song' }, isPlaying: true });

		await command({ action: 'pause', fromUserId: 'friend' });
		await settle();
		expect(media.paused).toBe(true);
		expect(sentStatuses().at(-1)).toMatchObject({ isPlaying: false });

		await command({ action: 'play', fromUserId: 'friend' });
		await settle();
		expect(media.paused).toBe(false);
		expect(sentStatuses().at(-1)).toMatchObject({ isPlaying: true });
		unmount();
	});

	it('never reports a playback the browser refused, and plays after the click', async () => {
		media.playResult = autoplayRefusal;
		const { unmount } = renderHook(() => useWebDevice());
		await settle();

		await receiveTrack();

		expect(media.play).toHaveBeenCalled();
		expect(usePlayerStore.getState().playbackState).toBe('paused');
		expect(sentStatuses().some(status => status.isPlaying)).toBe(false);
		expect(sentStatuses().at(-1)).toMatchObject({ track: { title: 'Song' }, isPlaying: false });
		const [title, , buttons] = (showAlert as jest.Mock).mock.calls[0] as [
			string,
			string,
			AlertButton[],
		];
		expect(title).toBe('Cliquer pour activer le son');

		media.playResult = () => Promise.resolve();
		await act(async () => buttons.find(button => button.text === 'Activer le son')?.onPress?.());
		await settle();

		expect(media.paused).toBe(false);
		expect(useAutoplayStore.getState().blocked).toBe(false);
		expect(sentStatuses().at(-1)).toMatchObject({ isPlaying: true });
		unmount();
	});
});
