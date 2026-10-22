import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as queueSyncService from '@/features/queue/services/queue-sync.service.js';
import type { QueueState } from '@/features/queue/queue.types.js';

const m = vi.hoisted(() => ({
	rpc: vi.fn(),
	getQueueRpc: vi.fn(),
	notifyQueueUpdate: vi.fn(),
	error: vi.fn(),
}));
vi.mock('@/shared/config/supabase.js', () => ({ supabaseAdmin: { rpc: m.rpc } }));
vi.mock('@/features/queue/utils/queue-rpc.js', () => ({ getQueueRpc: m.getQueueRpc }));
vi.mock('@/realtime/index.js', () => ({ realtime: { notifyQueueUpdate: m.notifyQueueUpdate } }));
vi.mock('@/shared/utils/logger.js', () => ({ logger: { info: vi.fn(), error: m.error } }));

const U1 = '11111111-1111-4111-8111-111111111111';
const U2 = '22222222-2222-4222-8222-222222222222';
const state = (ownerId: string): QueueState => ({
	ownerId,
	version: 1,
	currentItemId: null,
	items: [],
});

beforeEach(() => {
	for (const fn of Object.values(m)) fn.mockReset();
});

describe('queue-sync.service', () => {
	it('runs the function of the change and sends each affected user their queue', async () => {
		m.rpc.mockResolvedValue({ data: [U1, U2], error: null });
		m.getQueueRpc.mockImplementation(async (id: string) => state(id));

		await queueSyncService.syncPlaylistChange('moved', 'p', 't');

		expect(m.rpc).toHaveBeenCalledWith('queue_sync_track_moved', {
			p_playlist_id: 'p',
			p_track_id: 't',
		});
		expect(m.notifyQueueUpdate).toHaveBeenCalledWith(U1, state(U1));
		expect(m.notifyQueueUpdate).toHaveBeenCalledWith(U2, state(U2));
	});

	it('logs and swallows a failed sync', async () => {
		m.rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });

		await expect(queueSyncService.syncPlaylistChange('added', 'p', 't')).resolves.toBeUndefined();

		expect(m.error).toHaveBeenCalledWith(
			'Queue sync failed',
			expect.objectContaining({ error: 'boom' })
		);
		expect(m.notifyQueueUpdate).not.toHaveBeenCalled();
	});

	it('logs and swallows a failed notification, still notifying the others', async () => {
		m.rpc.mockResolvedValue({ data: [U1, U2], error: null });
		m.getQueueRpc.mockImplementation(async (id: string) => {
			if (id === U1) throw new Error('gone');
			return state(id);
		});

		await queueSyncService.syncPlaylistChange('removed', 'p', 't');

		expect(m.error).toHaveBeenCalledWith(
			'Queue sync notification failed',
			expect.objectContaining({ userId: U1, error: 'gone' })
		);
		expect(m.notifyQueueUpdate).toHaveBeenCalledWith(U2, state(U2));
	});
});
