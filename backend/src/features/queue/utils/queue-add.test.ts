import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addTrackToQueue } from '@/features/queue/utils/queue-add.js';
import { addQueueItemRpc, moveQueueItemRpc } from '@/features/queue/utils/queue-rpc.js';
import { upsertTrack } from '@/shared/utils/track-upsert.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import type { QueueState } from '@/features/queue/queue.types.js';

vi.mock('@/features/queue/utils/queue-rpc.js', () => ({
	addQueueItemRpc: vi.fn(),
	moveQueueItemRpc: vi.fn(),
}));
vi.mock('@/shared/utils/track-upsert.js', () => ({ upsertTrack: vi.fn() }));
vi.mock('@/shared/utils/logger.js', () => ({ logger: { warn: vi.fn() } }));

const track = { trackUri: 'https://soundcloud.com/a/t', title: 'T', artist: 'A', durationMs: 1 };

const state = (ids: string[], version: number): QueueState => ({
	ownerId: 'owner',
	version,
	currentItemId: 'a',
	items: ids.map(id => ({
		id,
		rank: id,
		track: { ...track, album: null, albumArt: null },
		sourcePlaylistId: null,
		blockId: null,
		blockDetached: false,
	})),
});

beforeEach(() => {
	vi.resetAllMocks();
	vi.mocked(upsertTrack).mockResolvedValue({ id: 'track-1' } as Awaited<
		ReturnType<typeof upsertTrack>
	>);
	vi.mocked(addQueueItemRpc).mockResolvedValue(state(['a', 'b', 'n'], 1));
});

describe('addTrackToQueue', () => {
	it('appends without a move when next is not set, and never stores the previewUrl', async () => {
		const result = await addTrackToQueue('owner', { ...track, previewUrl: 'https://x/stream' });
		expect(result).toEqual({ state: state(['a', 'b', 'n'], 1), operation: 'add' });
		expect(upsertTrack).toHaveBeenCalledWith({ ...track, previewUrl: undefined });
		expect(addQueueItemRpc).toHaveBeenCalledWith('owner', 'track-1');
		expect(moveQueueItemRpc).not.toHaveBeenCalled();
	});

	it('moves the appended item after the current one with next', async () => {
		vi.mocked(moveQueueItemRpc).mockResolvedValue(state(['a', 'n', 'b'], 2));
		const result = await addTrackToQueue('owner', track, true);
		expect(moveQueueItemRpc).toHaveBeenCalledWith('owner', 'n', null);
		expect(result).toEqual({ state: state(['a', 'n', 'b'], 2), operation: 'add-next' });
	});

	it("keeps the add's state when the move is refused", async () => {
		vi.mocked(moveQueueItemRpc).mockRejectedValue(
			new AppError(409, 'not upcoming', 'QUEUE_ITEM_NOT_UPCOMING')
		);
		const result = await addTrackToQueue('owner', track, true);
		expect(result).toEqual({ state: state(['a', 'b', 'n'], 1), operation: 'add' });
	});
});
