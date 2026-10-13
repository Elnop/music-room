import { ApiError, apiRequest } from '@/services/api';
import type { QueueState, QueueStepBoundary, QueueStepResult } from '@/types/queue.types';

/**
 * Play queue API (#273). Requests go through `apiRequest`, which adds the
 * token and client headers. The queue boundaries (409 `QUEUE_END` /
 * `QUEUE_START`) come back as a result, other failures throw an `ApiError`.
 */
async function step(path: string, boundary: QueueStepBoundary): Promise<QueueStepResult> {
	try {
		const state = await apiRequest<QueueState>(path, { method: 'POST' });
		return { ok: true, state };
	} catch (error) {
		if (error instanceof ApiError && error.status === 409 && error.code === boundary) {
			return { ok: false, code: boundary };
		}
		throw error;
	}
}

export const queueApi = {
	/** The caller's whole queue. */
	getQueue(): Promise<QueueState> {
		return apiRequest<QueueState>('/api/queue');
	},

	/** Step to the next item; `QUEUE_END` when there is none. */
	next(): Promise<QueueStepResult> {
		return step('/api/queue/next', 'QUEUE_END');
	},

	/** Step to the previous item; `QUEUE_START` when there is none. */
	previous(): Promise<QueueStepResult> {
		return step('/api/queue/previous', 'QUEUE_START');
	},

	/** Make an item current. */
	playItem(itemId: string): Promise<QueueState> {
		return apiRequest<QueueState>(`/api/queue/items/${encodeURIComponent(itemId)}/play`, {
			method: 'POST',
		});
	},
};
