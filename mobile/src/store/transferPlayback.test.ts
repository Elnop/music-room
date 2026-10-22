import { transferTo } from '@/store/transferPlayback';
import { useConnectStore } from '@/store/connectStore';
import { usePlayerStore, setPositionReader } from '@/store/playerStore';
import { useQueueStore } from '@/store/queueStore';
import { useAuthStore } from '@/store/authStore';
import { queueApi } from '@/services/queueApi';
import { ApiError } from '@/services/api';
import { showError } from '@utils/toast';
import { hapticSuccess } from '@utils/haptics';
import type { DevicePickerOwner } from '@/types/device.types';
import type { QueueItem, QueueState } from '@/types/queue.types';
import type { ListeningStatus } from '@/types/listening.types';
import type { SoundCloudTrack } from '@/types/soundcloud.types';
import type { UserProfile } from '@/types/user.types';
import { hashStringToNumber } from '@utils/trackToSoundCloud';
import { logger } from '@/utils/logger';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@services/oauth', () => ({
	signInWithGoogle: jest.fn(),
	signInWithFacebook: jest.fn(),
}));

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
	deviceService: { getDeviceInfo: jest.fn(async () => ({ deviceId: 'phone' })) },
}));

jest.mock('@/services/queueApi', () => ({
	queueApi: { getQueue: jest.fn(), transfer: jest.fn() },
}));

jest.mock('@utils/haptics', () => ({ hapticSuccess: jest.fn() }));

jest.mock('@utils/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

const transfer = queueApi.transfer as jest.Mock;

const device = (deviceId: string, online = true) => ({
	deviceId,
	deviceName: deviceId,
	platform: 'android',
	model: 'Model',
	lastSeenAt: '2026-10-15T00:00:00Z',
	access: 'all-devices' as const,
	online,
});

const me: DevicePickerOwner = {
	ownerId: 'me',
	username: 'moi',
	isSelf: true,
	devices: [device('phone'), device('pc')],
};
const lea: DevicePickerOwner = {
	ownerId: 'lea',
	username: 'Léa',
	isSelf: false,
	devices: [device('lea-tab')],
};

const item = (id: string): QueueItem => ({
	id,
	rank: id,
	track: {
		trackUri: `https://soundcloud.com/artist/${id}`,
		title: `Title ${id}`,
		artist: 'Artist',
		album: null,
		albumArt: null,
		durationMs: 200_000,
	},
	sourcePlaylistId: null,
	blockId: null,
	blockDetached: false,
});

const queue = (ownerId: string, current: string, version = 1): QueueState => ({
	ownerId,
	version,
	currentItemId: current,
	items: [item(current)],
});

const soundCloudTrack: SoundCloudTrack = {
	id: 7,
	title: 'Song',
	description: null,
	duration: 180_000,
	genre: null,
	artwork_url: null,
	permalink_url: 'https://soundcloud.com/artist/song',
	user: { id: 1, username: 'Artist', avatar_url: null, permalink_url: '' },
	playable: true,
};

/** Status of a device playing the queue item `itemId` (see `item`). */
const remoteStatus = (
	ownerId: string,
	deviceId: string,
	positionMs: number,
	itemId: string
): ListeningStatus => ({
	ownerId,
	device: { deviceId, deviceName: deviceId, platform: 'android', model: 'Model' },
	track: {
		id: hashStringToNumber(`https://soundcloud.com/artist/${itemId}`),
		title: 'x',
		artist: 'y',
		artworkUrl: null,
	},
	isPlaying: false,
	positionMs,
	updatedAt: '2026-10-15T00:00:00Z',
});

const stop = jest.fn();

beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	useAuthStore.setState({ user: { id: 'me' } as UserProfile, isAuthenticated: true });
	useQueueStore.getState().reset();
	useConnectStore.setState({
		target: { kind: 'local' },
		remoteStatus: null,
		controlPending: false,
	});
	usePlayerStore.setState({ currentTrack: null, queueItemId: null, stop });
	setPositionReader(null);
	transfer.mockResolvedValue({ ownerId: 'me', deviceId: 'x', queue: null });
});

describe('transferTo from this phone', () => {
	it('moves my queue item to my PC at its position and targets the PC', async () => {
		usePlayerStore.setState({ currentTrack: soundCloudTrack, queueItemId: 'i1' });
		setPositionReader(() => 42_000.4);

		await expect(transferTo(me, 'pc')).resolves.toBe(true);

		expect(transfer).toHaveBeenCalledWith({
			targetUserId: 'me',
			targetDeviceId: 'pc',
			positionMs: 42_000,
			playing: { queueItemId: 'i1' },
		});
		expect(useConnectStore.getState().target).toEqual({
			kind: 'remote',
			ownerId: 'me',
			deviceId: 'pc',
			ownerUsername: 'moi',
		});
		expect(stop).toHaveBeenCalled();
		expect(hapticSuccess).toHaveBeenCalledTimes(1);
	});

	it("sends a list track to Léa's device and applies her new queue", async () => {
		usePlayerStore.setState({ currentTrack: soundCloudTrack, queueItemId: null });
		setPositionReader(() => 10_000);
		transfer.mockResolvedValue({
			ownerId: 'lea',
			deviceId: 'lea-tab',
			queue: queue('lea', 'L1', 4),
		});

		await expect(transferTo(lea, 'lea-tab')).resolves.toBe(true);

		const body = transfer.mock.calls[0][0];
		expect(body.playing).toEqual({
			track: expect.objectContaining({ trackUri: soundCloudTrack.permalink_url }),
		});
		expect(body.positionMs).toBe(10_000);
		expect(body.source).toBeUndefined();
		expect(useConnectStore.getState().target).toMatchObject({
			ownerId: 'lea',
			deviceId: 'lea-tab',
			ownerUsername: 'Léa',
		});
		expect(useQueueStore.getState().queues.lea?.currentItemId).toBe('L1');
	});

	it('falls back to position 0 without a registered player', async () => {
		usePlayerStore.setState({ currentTrack: soundCloudTrack, queueItemId: 'i1' });
		await transferTo(me, 'pc');
		expect(transfer.mock.calls[0][0].positionMs).toBe(0);
	});
});

describe('transferTo from a remote device', () => {
	it('brings my PC item back to this phone, pausing the PC', async () => {
		useQueueStore.getState().applyState(queue('me', 'i2'));
		useConnectStore.setState({
			target: { kind: 'remote', ownerId: 'me', deviceId: 'pc' },
			remoteStatus: remoteStatus('me', 'pc', 30_000, 'i2'),
		});

		await expect(transferTo(me, 'phone')).resolves.toBe(true);

		expect(transfer).toHaveBeenCalledWith({
			targetUserId: 'me',
			targetDeviceId: 'phone',
			positionMs: 30_000,
			playing: { queueItemId: 'i2' },
			source: { userId: 'me', deviceId: 'pc' },
		});
		expect(useConnectStore.getState().target).toEqual({ kind: 'local' });
	});

	it("sends Léa's current item as a track to my PC", async () => {
		useConnectStore.setState({
			target: { kind: 'remote', ownerId: 'lea', deviceId: 'lea-tab', ownerUsername: 'Léa' },
			remoteStatus: remoteStatus('lea', 'lea-tab', 5_000, 'L1'),
		});
		useQueueStore.getState().applyState(queue('lea', 'L1'));

		await transferTo(me, 'pc');

		expect(transfer).toHaveBeenCalledWith({
			targetUserId: 'me',
			targetDeviceId: 'pc',
			positionMs: 5_000,
			playing: {
				track: {
					trackUri: 'https://soundcloud.com/artist/L1',
					title: 'Title L1',
					artist: 'Artist',
					album: undefined,
					albumArt: undefined,
					durationMs: 200_000,
				},
			},
			source: { userId: 'lea', deviceId: 'lea-tab' },
		});
		expect(useConnectStore.getState().target).toMatchObject({ ownerId: 'me', deviceId: 'pc' });
	});
});

describe('transferTo a track the remote device plays off the queue', () => {
	const target = { kind: 'remote' as const, ownerId: 'me', deviceId: 'pc' };

	it('refuses when the queue current item is not the played track', async () => {
		useQueueStore.getState().applyState(queue('me', 'i2'));
		useConnectStore.setState({ target, remoteStatus: remoteStatus('me', 'pc', 0, 'other') });

		await expect(transferTo(lea, 'lea-tab')).resolves.toBe(false);

		expect(transfer).not.toHaveBeenCalled();
		expect(showError).toHaveBeenCalledWith('Ce titre ne peut pas être transféré');
		expect(useConnectStore.getState().target).toEqual(target);
		expect(hapticSuccess).not.toHaveBeenCalled();
	});

	it('refuses when the queue has no current item', async () => {
		useConnectStore.setState({ target, remoteStatus: remoteStatus('me', 'pc', 0, 'i2') });

		await expect(transferTo(me, 'phone')).resolves.toBe(false);

		expect(transfer).not.toHaveBeenCalled();
		expect(showError).toHaveBeenCalledWith('Ce titre ne peut pas être transféré');
		expect(useConnectStore.getState().target).toEqual(target);
	});
});

describe('transferTo refused', () => {
	it.each([
		[
			'409',
			new ApiError('offline', 'DEVICE_OFFLINE', undefined, 409),
			"Cet appareil n'est plus en ligne",
		],
		[
			'403',
			new ApiError('denied', 'QUEUE_ACCESS_DENIED', undefined, 403),
			'Vous ne pouvez pas contrôler cet appareil',
		],
		[
			'404',
			new ApiError('gone', 'QUEUE_ITEM_NOT_FOUND', undefined, 404),
			"Ce titre n'est plus dans la file d'attente",
		],
		['network', new Error('network'), 'Impossible de transférer la lecture'],
	])('shows a toast and changes nothing (%s)', async (_label, error, message) => {
		usePlayerStore.setState({ currentTrack: soundCloudTrack, queueItemId: 'i1' });
		transfer.mockRejectedValue(error);

		await expect(transferTo(lea, 'lea-tab')).resolves.toBe(false);

		expect(showError).toHaveBeenCalledWith(message);
		expect(useConnectStore.getState().target).toEqual({ kind: 'local' });
		expect(stop).not.toHaveBeenCalled();
		expect(hapticSuccess).not.toHaveBeenCalled();
	});

	it('keeps the remote target on a refusal', async () => {
		useQueueStore.getState().applyState(queue('me', 'i2'));
		const target = { kind: 'remote' as const, ownerId: 'me', deviceId: 'pc' };
		useConnectStore.setState({ target, remoteStatus: remoteStatus('me', 'pc', 0, 'i2') });
		transfer.mockRejectedValue(new ApiError('offline', 'DEVICE_OFFLINE', undefined, 409));

		await expect(transferTo(lea, 'lea-tab')).resolves.toBe(false);

		expect(useConnectStore.getState().target).toEqual(target);
	});
});

describe('transferTo with nothing playing', () => {
	it('switches to the device without a transfer', async () => {
		await expect(transferTo(me, 'pc')).resolves.toBe(true);
		expect(transfer).not.toHaveBeenCalled();
		expect(useConnectStore.getState().target).toMatchObject({ kind: 'remote', deviceId: 'pc' });
		expect(hapticSuccess).toHaveBeenCalledTimes(1);
	});

	it('comes back to this phone without a transfer', async () => {
		useConnectStore.setState({
			target: { kind: 'remote', ownerId: 'me', deviceId: 'pc' },
			remoteStatus: null,
		});
		await expect(transferTo(me, 'phone')).resolves.toBe(true);
		expect(transfer).not.toHaveBeenCalled();
		expect(useConnectStore.getState().target).toEqual({ kind: 'local' });
	});
});

describe('transferTo the active device', () => {
	it('does nothing for this phone in local mode', async () => {
		usePlayerStore.setState({ currentTrack: soundCloudTrack, queueItemId: 'i1' });
		await expect(transferTo(me, 'phone')).resolves.toBe(true);
		expect(transfer).not.toHaveBeenCalled();
		expect(stop).not.toHaveBeenCalled();
		expect(hapticSuccess).not.toHaveBeenCalled();
	});

	it('does nothing for the remote target', async () => {
		useQueueStore.getState().applyState(queue('me', 'i2'));
		useConnectStore.setState({
			target: { kind: 'remote', ownerId: 'me', deviceId: 'pc' },
			remoteStatus: remoteStatus('me', 'pc', 0, 'i2'),
		});
		await expect(transferTo(me, 'pc')).resolves.toBe(true);
		expect(transfer).not.toHaveBeenCalled();
		expect(hapticSuccess).not.toHaveBeenCalled();
	});
});
