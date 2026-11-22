import { createStore } from 'zustand';
import { transferTo } from '@/features/playback/features/control-delegation/features/device-picker/lib/transferTo';
import { setPositionReader } from '@/features/playback/shared/player/lib/positionReader';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import { queueStore } from '@/features/playback/shared/player/stores/queueStore';
import { connectStore } from '@/features/playback/shared/player/stores/connectStore';
import { queueApi } from '@/features/playback/shared/player/lib/queueApi';
import { registerAuthSession } from '@/shared/backend/lib/authSession';
import type { SessionView } from '@/shared/backend/types/sessionTypes';
import { ApiError } from '@/shared/backend/lib/ApiError';
import { showError } from '@/shared/theme/lib/toast';
import { hapticSuccess } from '@/shared/theme/lib/haptics';
import type { DevicePickerOwner } from '@/features/playback/features/control-delegation/shared/delegation/types/deviceTypes';
import type { QueueItem, QueueState } from '@/shared/playback/types/queueTypes';
import type { ListeningStatus } from '@/features/playback/shared/player/types/listeningTypes';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import type { UserProfile } from '@/shared/users/userTypes';
import { hashStringToNumber } from '@/features/playback/shared/player/lib/trackToSoundCloud';
import { logger } from '@/shared/logging/logger';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/backend/deviceService', () => ({
	getAppVersion: () => '1.2.3',
	deviceService: { getDeviceInfo: jest.fn(async () => ({ deviceId: 'phone' })) },
}));

jest.mock('@/features/playback/shared/player/lib/queueApi', () => ({
	queueApi: { getQueue: jest.fn(), transfer: jest.fn() },
}));

jest.mock('@/shared/theme/lib/haptics', () => ({ hapticSuccess: jest.fn() }));

jest.mock('@/shared/theme/lib/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

const transfer = queueApi.transfer as jest.Mock;

function device(deviceId: string, online = true) {
	return {
		deviceId,
		deviceName: deviceId,
		platform: 'android',
		model: 'Model',
		lastSeenAt: '2026-10-15T00:00:00Z',
		access: 'all-devices' as const,
		online,
	};
}

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

function item(id: string): QueueItem {
	return {
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
	};
}

function queue(ownerId: string, current: string, version = 1): QueueState {
	return {
		ownerId,
		version,
		currentItemId: current,
		items: [item(current)],
	};
}

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

function remoteStatus(
	ownerId: string,
	deviceId: string,
	positionMs: number,
	itemId: string
): ListeningStatus {
	return {
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
	};
}

const stop = jest.fn();
let position = 0;

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

const initialPlayerState = playerStore.getState();

beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	testSessionStore.setState({ user: { id: 'me' } as UserProfile, isAuthenticated: true });
	queueStore.getState().reset();
	connectStore.setState({
		target: { kind: 'local' },
		remoteStatus: null,
		controlPending: false,
	});
	playerStore.setState({ ...initialPlayerState, stop }, true);
	position = 0;
	setPositionReader(() => position);
	transfer.mockResolvedValue({ ownerId: 'me', deviceId: 'x', queue: null });
});

afterEach(() => {
	setPositionReader(null);
});

describe('transferTo from this phone', () => {
	it('moves my queue item to my PC at its position and targets the PC', async () => {
		playerStore.setState({ currentTrack: soundCloudTrack, queueItemId: 'i1' });
		position = 42_000.4;

		await expect(transferTo(me, 'pc')).resolves.toBe(true);

		expect(transfer).toHaveBeenCalledWith({
			targetUserId: 'me',
			targetDeviceId: 'pc',
			positionMs: 42_000,
			playing: { queueItemId: 'i1' },
		});
		expect(connectStore.getState().target).toStrictEqual({
			kind: 'remote',
			ownerId: 'me',
			deviceId: 'pc',
			ownerUsername: 'moi',
		});
		expect(stop).toHaveBeenCalledWith();
		expect(hapticSuccess).toHaveBeenCalledTimes(1);
	});

	it("sends a list track to Léa's device and applies her new queue", async () => {
		playerStore.setState({ currentTrack: soundCloudTrack, queueItemId: null });
		position = 10_000;
		transfer.mockResolvedValue({
			ownerId: 'lea',
			deviceId: 'lea-tab',
			queue: queue('lea', 'L1', 4),
		});

		await expect(transferTo(lea, 'lea-tab')).resolves.toBe(true);

		const body = transfer.mock.calls[0][0];
		expect(body.playing).toStrictEqual({
			track: expect.objectContaining({ trackUri: soundCloudTrack.permalink_url }),
		});
		expect(body.positionMs).toBe(10_000);
		expect(body.source).toBeUndefined();
		expect(connectStore.getState().target).toMatchObject({
			ownerId: 'lea',
			deviceId: 'lea-tab',
			ownerUsername: 'Léa',
		});
		expect(queueStore.getState().queues.lea?.currentItemId).toBe('L1');
	});

	it('falls back to position 0 without a registered player', async () => {
		playerStore.setState({ currentTrack: soundCloudTrack, queueItemId: 'i1' });
		position = 0;
		await transferTo(me, 'pc');
		expect(transfer.mock.calls[0][0].positionMs).toBe(0);
	});
});

describe('transferTo from a remote device', () => {
	it('brings my PC item back to this phone, pausing the PC', async () => {
		queueStore.getState().applyState(queue('me', 'i2'));
		connectStore.setState({
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
		expect(connectStore.getState().target).toStrictEqual({ kind: 'local' });
	});

	it("sends Léa's current item as a track to my PC", async () => {
		connectStore.setState({
			target: { kind: 'remote', ownerId: 'lea', deviceId: 'lea-tab', ownerUsername: 'Léa' },
			remoteStatus: remoteStatus('lea', 'lea-tab', 5_000, 'L1'),
		});
		queueStore.getState().applyState(queue('lea', 'L1'));

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
		expect(connectStore.getState().target).toMatchObject({ ownerId: 'me', deviceId: 'pc' });
	});
});

describe('transferTo a track the remote device plays off the queue', () => {
	const target = { kind: 'remote' as const, ownerId: 'me', deviceId: 'pc' };

	it('refuses when the queue current item is not the played track', async () => {
		queueStore.getState().applyState(queue('me', 'i2'));
		connectStore.setState({ target, remoteStatus: remoteStatus('me', 'pc', 0, 'other') });

		await expect(transferTo(lea, 'lea-tab')).resolves.toBe(false);

		expect(transfer).not.toHaveBeenCalled();
		expect(showError).toHaveBeenCalledWith('Ce titre ne peut pas être transféré');
		expect(connectStore.getState().target).toStrictEqual(target);
		expect(hapticSuccess).not.toHaveBeenCalled();
	});

	it('refuses when the queue has no current item', async () => {
		connectStore.setState({ target, remoteStatus: remoteStatus('me', 'pc', 0, 'i2') });

		await expect(transferTo(me, 'phone')).resolves.toBe(false);

		expect(transfer).not.toHaveBeenCalled();
		expect(showError).toHaveBeenCalledWith('Ce titre ne peut pas être transféré');
		expect(connectStore.getState().target).toStrictEqual(target);
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
		playerStore.setState({ currentTrack: soundCloudTrack, queueItemId: 'i1' });
		transfer.mockRejectedValue(error);

		await expect(transferTo(lea, 'lea-tab')).resolves.toBe(false);

		expect(showError).toHaveBeenCalledWith(message);
		expect(connectStore.getState().target).toStrictEqual({ kind: 'local' });
		expect(stop).not.toHaveBeenCalled();
		expect(hapticSuccess).not.toHaveBeenCalled();
	});

	it('keeps the remote target on a refusal', async () => {
		queueStore.getState().applyState(queue('me', 'i2'));
		const target = { kind: 'remote' as const, ownerId: 'me', deviceId: 'pc' };
		connectStore.setState({ target, remoteStatus: remoteStatus('me', 'pc', 0, 'i2') });
		transfer.mockRejectedValue(new ApiError('offline', 'DEVICE_OFFLINE', undefined, 409));

		await expect(transferTo(lea, 'lea-tab')).resolves.toBe(false);

		expect(connectStore.getState().target).toStrictEqual(target);
	});
});

describe('transferTo with nothing playing', () => {
	it('switches to the device without a transfer', async () => {
		await expect(transferTo(me, 'pc')).resolves.toBe(true);
		expect(transfer).not.toHaveBeenCalled();
		expect(connectStore.getState().target).toMatchObject({ kind: 'remote', deviceId: 'pc' });
		expect(hapticSuccess).toHaveBeenCalledTimes(1);
	});

	it('comes back to this phone without a transfer', async () => {
		connectStore.setState({
			target: { kind: 'remote', ownerId: 'me', deviceId: 'pc' },
			remoteStatus: null,
		});
		await expect(transferTo(me, 'phone')).resolves.toBe(true);
		expect(transfer).not.toHaveBeenCalled();
		expect(connectStore.getState().target).toStrictEqual({ kind: 'local' });
	});
});

describe('transferTo the active device', () => {
	it('does nothing for this phone in local mode', async () => {
		playerStore.setState({ currentTrack: soundCloudTrack, queueItemId: 'i1' });
		await expect(transferTo(me, 'phone')).resolves.toBe(true);
		expect(transfer).not.toHaveBeenCalled();
		expect(stop).not.toHaveBeenCalled();
		expect(hapticSuccess).not.toHaveBeenCalled();
	});

	it('does nothing for the remote target', async () => {
		queueStore.getState().applyState(queue('me', 'i2'));
		connectStore.setState({
			target: { kind: 'remote', ownerId: 'me', deviceId: 'pc' },
			remoteStatus: remoteStatus('me', 'pc', 0, 'i2'),
		});
		await expect(transferTo(me, 'pc')).resolves.toBe(true);
		expect(transfer).not.toHaveBeenCalled();
		expect(hapticSuccess).not.toHaveBeenCalled();
	});
});
