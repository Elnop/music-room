import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as queueService from '@/features/queue/services/queue.service.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import type { QueueState } from '@/features/queue/queue.types.js';

const m = vi.hoisted(() => ({
	assertCanManageQueue: vi.fn(),
	resolvePlaybackDevice: vi.fn(),
	sendPlayCommand: vi.fn(),
	addTrackToQueue: vi.fn(),
	notifyQueueUpdate: vi.fn(),
	getPlaylistForPermissionCheck: vi.fn(),
	canViewPlaylist: vi.fn(),
	getQueueRpc: vi.fn(),
	moveQueueItemRpc: vi.fn(),
	playPlaylistRpc: vi.fn(),
	playQueueItemRpc: vi.fn(),
	removeQueueItemRpc: vi.fn(),
	stepQueueRpc: vi.fn(),
}));
vi.mock('@/features/queue/permissions/queue.permissions.js', () => ({
	assertCanManageQueue: m.assertCanManageQueue,
	resolvePlaybackDevice: m.resolvePlaybackDevice,
}));
vi.mock('@/features/queue/utils/queue-play-command.js', () => ({
	sendPlayCommand: m.sendPlayCommand,
}));
vi.mock('@/features/queue/utils/queue-add.js', () => ({ addTrackToQueue: m.addTrackToQueue }));
vi.mock('@/realtime/index.js', () => ({ realtime: { notifyQueueUpdate: m.notifyQueueUpdate } }));
vi.mock('@/features/playlists/permissions/playlist.permissions.js', () => ({
	getPlaylistForPermissionCheck: m.getPlaylistForPermissionCheck,
	canViewPlaylist: m.canViewPlaylist,
}));
vi.mock('@/features/queue/utils/queue-rpc.js', () => ({
	getQueueRpc: m.getQueueRpc,
	moveQueueItemRpc: m.moveQueueItemRpc,
	playPlaylistRpc: m.playPlaylistRpc,
	playQueueItemRpc: m.playQueueItemRpc,
	removeQueueItemRpc: m.removeQueueItemRpc,
	stepQueueRpc: m.stepQueueRpc,
}));
vi.mock('@/shared/utils/logger.js', () => ({ logger: { info: vi.fn() } }));

const STATE: QueueState = { ownerId: 'owner', version: 2, currentItemId: null, items: [] };
const track = { trackUri: 'https://soundcloud.com/a/t', title: 'T', artist: 'A', durationMs: 1 };

beforeEach(() => {
	for (const fn of Object.values(m)) fn.mockReset();
	m.assertCanManageQueue.mockResolvedValue(undefined);
	for (const rpc of [
		m.getQueueRpc,
		m.moveQueueItemRpc,
		m.playPlaylistRpc,
		m.playQueueItemRpc,
		m.removeQueueItemRpc,
		m.stepQueueRpc,
	]) {
		rpc.mockResolvedValue(STATE);
	}
});

describe('queue.service', () => {
	it('getQueue checks access and reads without publishing', async () => {
		await expect(queueService.getQueue('me', 'owner')).resolves.toBe(STATE);

		expect(m.assertCanManageQueue).toHaveBeenCalledWith('me', 'owner');
		expect(m.notifyQueueUpdate).not.toHaveBeenCalled();
	});

	it('refuses before any change when access is denied', async () => {
		m.assertCanManageQueue.mockRejectedValue(new AppError(403, 'no', 'QUEUE_ACCESS_DENIED'));

		await expect(queueService.removeItem('me', 'owner', 'i')).rejects.toBeInstanceOf(AppError);
		expect(m.removeQueueItemRpc).not.toHaveBeenCalled();
	});

	it('addItem publishes the state of the add', async () => {
		m.addTrackToQueue.mockResolvedValue({ state: STATE, operation: 'add-next' });

		await expect(queueService.addItem('me', 'owner', track, { next: true })).resolves.toBe(STATE);

		expect(m.addTrackToQueue).toHaveBeenCalledWith('owner', track, true);
		expect(m.notifyQueueUpdate).toHaveBeenCalledWith('owner', STATE);
	});

	it.each([
		['removeItem', () => queueService.removeItem('me', 'owner', 'i'), m.removeQueueItemRpc],
		['moveItem', () => queueService.moveItem('me', 'owner', 'i', null), m.moveQueueItemRpc],
	] as const)('%s publishes the new state', async (_, run, rpc) => {
		await expect(run()).resolves.toBe(STATE);

		expect(rpc).toHaveBeenCalled();
		expect(m.notifyQueueUpdate).toHaveBeenCalledWith('owner', STATE);
	});

	it('playItem publishes and tells the chosen device to play', async () => {
		m.resolvePlaybackDevice.mockResolvedValue('tv');

		await queueService.playItem('me', 'owner', 'i', 'tv');

		expect(m.resolvePlaybackDevice).toHaveBeenCalledWith('me', 'owner', 'tv');
		expect(m.notifyQueueUpdate).toHaveBeenCalledWith('owner', STATE);
		expect(m.sendPlayCommand).toHaveBeenCalledWith('me', 'owner', 'tv', STATE);
	});

	it('step sends no play command when the owner plays on the calling device', async () => {
		m.resolvePlaybackDevice.mockResolvedValue(null);

		await queueService.step('owner', 'owner', 'next');

		expect(m.stepQueueRpc).toHaveBeenCalledWith('owner', 'next');
		expect(m.sendPlayCommand).not.toHaveBeenCalled();
	});

	it('playPlaylist refuses a playlist the actor cannot view, before any change', async () => {
		m.resolvePlaybackDevice.mockResolvedValue(null);
		m.getPlaylistForPermissionCheck.mockResolvedValue({ id: 'p' });
		m.canViewPlaylist.mockReturnValue(false);

		await expect(queueService.playPlaylist('me', 'owner', 'p')).rejects.toMatchObject({
			statusCode: 403,
			code: 'PLAYLIST_ACCESS_DENIED',
		});
		expect(m.playPlaylistRpc).not.toHaveBeenCalled();
	});

	it('playPlaylist plays a visible playlist', async () => {
		m.resolvePlaybackDevice.mockResolvedValue('tv');
		m.getPlaylistForPermissionCheck.mockResolvedValue({ id: 'p' });
		m.canViewPlaylist.mockReturnValue(true);

		await expect(queueService.playPlaylist('me', 'owner', 'p', 'tv')).resolves.toBe(STATE);
		expect(m.playPlaylistRpc).toHaveBeenCalledWith('owner', 'p');
		expect(m.sendPlayCommand).toHaveBeenCalledWith('me', 'owner', 'tv', STATE);
	});
});
