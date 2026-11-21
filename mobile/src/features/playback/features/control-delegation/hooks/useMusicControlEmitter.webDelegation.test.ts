import { act, renderHook } from '@testing-library/react-native';
import type { AlertButton } from 'react-native';
import { usePlayerAudio } from '@/features/playback/shared/player/hooks/usePlayerAudio';
import { useAutoplayPrompt } from '@/features/playback/shared/player/hooks/useAutoplayPrompt';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import { autoplayStore } from '@/features/playback/shared/player/stores/autoplayStore';
import { useMusicControlEmitter } from '@/features/playback/features/control-delegation/hooks/useMusicControlEmitter';
import { showAlert } from '@/shared/alerts/showAlert';
import type { DeviceCommand } from '@/shared/playback/types/queueTypes';
import {
	FakeMediaElement,
	autoplayRefusal,
	installFakeDocument,
} from '@test-utils/fakeMediaElement';

jest.mock('@/features/playback/shared/player/lib/audioPlayer', () =>
	jest.requireActual('@/features/playback/shared/player/lib/audioPlayer.web')
);
jest.mock('hls.js', () => ({ __esModule: true, default: { isSupported: () => false } }));
jest.mock('@/features/playback/shared/player/lib/fetchStreamUrl', () => ({
	fetchStreamUrl: () =>
		Promise.resolve({ streamUrl: 'https://cdn/stream.m3u8', expiresAt: Date.now() + 1_800_000 }),
}));
jest.mock('@/shared/alerts/showAlert', () => ({ showAlert: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockSocket = { connected: true, on: jest.fn(), off: jest.fn(), emit: jest.fn() };
const mockSession = { user: { id: 'owner' }, accessToken: 'token', isAuthenticated: true };

jest.mock('@/shared/backend/hooks/useSocketState', () => ({
	useSocketState: (selector: (state: object) => unknown) =>
		selector({ socket: mockSocket, isConnected: true }),
}));
jest.mock('@/shared/backend/hooks/useSession', () => ({
	useSession: (selector: (state: object) => unknown) => selector(mockSession),
}));
jest.mock('@/shared/backend/lib/authSession', () => ({
	getSession: () => mockSession,
}));
jest.mock('@/shared/backend/lib/sessionEnd', () => ({
	onSessionEnd: () => () => undefined,
}));
jest.mock('@/shared/backend/deviceService', () => ({
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

function command(data: DeviceCommand | { action: 'play'; fromUserId: string }) {
	const call = mockSocket.on.mock.calls.find(([event]) => event === 'control:command');
	return act(async () => (call![1] as (payload: typeof data) => void)(data));
}

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

function sentStatuses() {
	return mockSocket.emit.mock.calls
		.filter(([event]) => event === 'listening:update')
		.map(([, status]) => status as { track: { title: string } | null; isPlaying: boolean });
}

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

beforeEach(() => {
	jest.useFakeTimers();
	jest.clearAllMocks();
	Object.assign(media, { paused: true, ended: false, readyState: 0, duration: Number.NaN });
	media.playResult = () => Promise.resolve();
	playerStore.setState(playerStore.getInitialState());
	autoplayStore.setState({ blocked: false });
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

		expect(media.play).toHaveBeenCalledWith();
		expect(playerStore.getState().playbackState).toBe('paused');
		expect(sentStatuses().some(status => status.isPlaying)).toBe(false);
		expect(sentStatuses().at(-1)).toMatchObject({ track: { title: 'Song' }, isPlaying: false });
		const [title, , buttons] = (showAlert as jest.Mock).mock.calls[0] as [
			string,
			string,
			AlertButton[],
		];
		expect(title).toBe('Cliquer pour activer le son');

		media.playResult = () => Promise.resolve();
		const activateSound = buttons.find(button => button.text === 'Activer le son');
		await act(async () => activateSound?.onPress?.());
		await settle();

		expect(media.paused).toBe(false);
		expect(autoplayStore.getState().blocked).toBe(false);
		expect(sentStatuses().at(-1)).toMatchObject({ isPlaying: true });
		unmount();
	});
});
