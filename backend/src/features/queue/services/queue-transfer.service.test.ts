import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as queueTransferService from '@/features/queue/services/queue-transfer.service.js';
import type { TransferInput } from '@/features/queue/queue.validators.js';
import type { QueueItem, QueueState } from '@/features/queue/queue.types.js';

const m = vi.hoisted(() => ({
	resolvePlaybackDevice: vi.fn(),
	canControlDevice: vi.fn(),
	getQueueRpc: vi.fn(),
	insertBlockRpc: vi.fn(),
	trackIdsFromRpc: vi.fn(),
	upcomingTrackIdsRpc: vi.fn(),
	upsertTrack: vi.fn(),
	notifyQueueUpdate: vi.fn(),
	sendDeviceCommand: vi.fn(),
}));
vi.mock('@/features/queue/permissions/queue.permissions.js', () => ({
	resolvePlaybackDevice: m.resolvePlaybackDevice,
}));
vi.mock('@/features/music-control/services/control-access.service.js', () => ({
	canControlDevice: m.canControlDevice,
}));
vi.mock('@/features/queue/utils/queue-rpc.js', () => ({
	getQueueRpc: m.getQueueRpc,
	insertBlockRpc: m.insertBlockRpc,
	trackIdsFromRpc: m.trackIdsFromRpc,
	upcomingTrackIdsRpc: m.upcomingTrackIdsRpc,
}));
vi.mock('@/shared/utils/track-upsert.js', () => ({ upsertTrack: m.upsertTrack }));
vi.mock('@/realtime/emitters/queue.emitters.js', () => ({
	notifyQueueUpdate: m.notifyQueueUpdate,
	sendDeviceCommand: m.sendDeviceCommand,
}));
vi.mock('@/shared/utils/logger.js', () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));

const ME = 'me';
const FRIEND = 'friend';
const track = { trackUri: 'https://soundcloud.com/a/t', title: 'T', artist: 'A', durationMs: 1 };
const item = (id: string): QueueItem => ({
	id,
	rank: id,
	track: { ...track, album: null, albumArt: null },
	sourcePlaylistId: null,
	blockId: null,
	blockDetached: false,
});
const MINE: QueueState = { ownerId: ME, version: 4, currentItemId: 'i1', items: [item('i1')] };
const input = (fields: Partial<TransferInput>): TransferInput => ({
	targetUserId: ME,
	targetDeviceId: 'tv',
	positionMs: 1000,
	playing: { queueItemId: 'i1' },
	...fields,
});

beforeEach(() => {
	for (const fn of Object.values(m)) fn.mockReset();
	m.resolvePlaybackDevice.mockResolvedValue('tv');
	m.canControlDevice.mockResolvedValue(true);
	m.getQueueRpc.mockResolvedValue(MINE);
	m.sendDeviceCommand.mockReturnValue(true);
});

describe('queue-transfer.service', () => {
	it('plays an item of my queue on my device, without changing a queue', async () => {
		const result = await queueTransferService.transfer(ME, input({}));

		expect(result).toEqual({ ownerId: ME, deviceId: 'tv', queue: null });
		expect(m.sendDeviceCommand).toHaveBeenCalledWith(ME, 'tv', {
			action: 'play-item',
			fromUserId: ME,
			item: item('i1'),
			positionMs: 1000,
			version: 4,
		});
		expect(m.insertBlockRpc).not.toHaveBeenCalled();
	});

	it('plays a track outside the queue on my device', async () => {
		await queueTransferService.transfer(
			ME,
			input({ playing: { track: { ...track, album: undefined } } })
		);

		expect(m.sendDeviceCommand).toHaveBeenCalledWith(ME, 'tv', {
			action: 'play-track',
			fromUserId: ME,
			track: { ...track, album: null, albumArt: null },
			positionMs: 1000,
		});
	});

	it('answers 404 for an item that is not in my queue, before any change', async () => {
		await expect(
			queueTransferService.transfer(ME, input({ playing: { queueItemId: 'other' } }))
		).rejects.toMatchObject({ statusCode: 404, code: 'QUEUE_ITEM_NOT_FOUND' });
		expect(m.sendDeviceCommand).not.toHaveBeenCalled();
	});

	it("inserts the played track and what follows into a friend's queue", async () => {
		const theirs: QueueState = {
			ownerId: FRIEND,
			version: 9,
			currentItemId: 'f1',
			items: [item('f1')],
		};
		m.upsertTrack.mockResolvedValue({ id: 't0' });
		m.upcomingTrackIdsRpc.mockResolvedValue(['t1', 't2']);
		m.insertBlockRpc.mockResolvedValue(theirs);

		const result = await queueTransferService.transfer(
			ME,
			input({ targetUserId: FRIEND, playing: { track: { ...track, album: undefined } } })
		);

		expect(m.insertBlockRpc).toHaveBeenCalledWith(FRIEND, ['t0', 't1', 't2']);
		expect(m.notifyQueueUpdate).toHaveBeenCalledWith(FRIEND, theirs);
		expect(m.sendDeviceCommand).toHaveBeenCalledWith(FRIEND, 'tv', {
			action: 'play-item',
			fromUserId: ME,
			item: item('f1'),
			positionMs: 1000,
			version: 9,
		});
		expect(result).toEqual({ ownerId: FRIEND, deviceId: 'tv', queue: theirs });
	});

	it("takes a queue item and its followers by id for a friend's queue", async () => {
		const theirs: QueueState = {
			ownerId: FRIEND,
			version: 1,
			currentItemId: 'f1',
			items: [item('f1')],
		};
		m.trackIdsFromRpc.mockResolvedValue(['t1']);
		m.insertBlockRpc.mockResolvedValue(theirs);

		await queueTransferService.transfer(ME, input({ targetUserId: FRIEND }));

		expect(m.trackIdsFromRpc).toHaveBeenCalledWith(ME, 'i1');
		expect(m.insertBlockRpc).toHaveBeenCalledWith(FRIEND, ['t1']);
	});

	it('answers 500 when the new block has no current item', async () => {
		m.trackIdsFromRpc.mockResolvedValue(['t1']);
		m.insertBlockRpc.mockResolvedValue({
			ownerId: FRIEND,
			version: 1,
			currentItemId: null,
			items: [],
		});

		await expect(
			queueTransferService.transfer(ME, input({ targetUserId: FRIEND }))
		).rejects.toMatchObject({ statusCode: 500, code: 'QUEUE_OPERATION_ERROR' });
		expect(m.sendDeviceCommand).not.toHaveBeenCalled();
	});

	it('pauses the source device', async () => {
		await queueTransferService.transfer(ME, input({ source: { userId: ME, deviceId: 'phone' } }));

		expect(m.sendDeviceCommand).toHaveBeenCalledWith(ME, 'phone', {
			action: 'pause',
			fromUserId: ME,
		});
	});

	it('does not pause the source when it is also the target', async () => {
		await queueTransferService.transfer(ME, input({ source: { userId: ME, deviceId: 'tv' } }));

		expect(m.sendDeviceCommand).toHaveBeenCalledTimes(1);
		expect(m.sendDeviceCommand).not.toHaveBeenCalledWith(
			ME,
			'tv',
			expect.objectContaining({ action: 'pause' })
		);
	});

	it('refuses a source device the actor cannot control, before any change', async () => {
		m.canControlDevice.mockResolvedValue(false);

		await expect(
			queueTransferService.transfer(ME, input({ source: { userId: FRIEND, deviceId: 'phone' } }))
		).rejects.toMatchObject({ statusCode: 403, code: 'QUEUE_ACCESS_DENIED' });
		expect(m.sendDeviceCommand).not.toHaveBeenCalled();
	});
});
