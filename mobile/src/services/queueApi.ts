import { ApiError, apiRequest } from '@/shared/services/api';
import type {
	AddQueueItemBody,
	QueueState,
	QueueStepBoundary,
	QueueStepResult,
	TransferRequest,
	TransferResult,
} from '@/types/queue.types';

/**
 * Whose queue a call acts on and which device plays (#297). `ownerId` is
 * another user, whose queue is reached through `/api/users/:ownerId/queue`;
 * omit it for my own queue. `deviceId` makes that device play the result of a
 * play-item, next, previous or play-playlist; omitted, this device plays.
 */
export interface QueueCallTarget {
	ownerId?: string;
	deviceId?: string;
}

const base = ({ ownerId }: QueueCallTarget = {}): string =>
	ownerId ? `/api/users/${encodeURIComponent(ownerId)}/queue` : '/api/queue';

/** Body of a playback call: `{ deviceId }` when a device is targeted. */
const deviceBody = ({ deviceId }: QueueCallTarget = {}): { body?: string } =>
	deviceId ? { body: JSON.stringify({ deviceId }) } : {};

/**
 * Play queue API (#273). Requests go through `apiRequest`, which adds the
 * token and client headers. The queue boundaries (409 `QUEUE_END` /
 * `QUEUE_START`) come back as a result, other failures throw an `ApiError`
 * (403 `QUEUE_ACCESS_DENIED`, 409 `DEVICE_OFFLINE` for another queue or device).
 */
async function step(
	path: string,
	boundary: QueueStepBoundary,
	target: QueueCallTarget = {}
): Promise<QueueStepResult> {
	try {
		const state = await apiRequest<QueueState>(path, { method: 'POST', ...deviceBody(target) });
		return { ok: true, state };
	} catch (error) {
		if (error instanceof ApiError && error.status === 409 && error.code === boundary) {
			return { ok: false, code: boundary };
		}
		throw error;
	}
}

export const queueApi = {
	/** The whole queue (mine, or `ownerId`'s). */
	getQueue(target: QueueCallTarget = {}): Promise<QueueState> {
		return apiRequest<QueueState>(base(target));
	},

	/** Step to the next item; `QUEUE_END` when there is none. */
	next(target: QueueCallTarget = {}): Promise<QueueStepResult> {
		return step(`${base(target)}/next`, 'QUEUE_END', target);
	},

	/** Step to the previous item; `QUEUE_START` when there is none. */
	previous(target: QueueCallTarget = {}): Promise<QueueStepResult> {
		return step(`${base(target)}/previous`, 'QUEUE_START', target);
	},

	/** Append a track to the end of the queue; with `next: true`, right after the current item. */
	addItem(body: AddQueueItemBody, target: QueueCallTarget = {}): Promise<QueueState> {
		return apiRequest<QueueState>(`${base(target)}/items`, {
			method: 'POST',
			body: JSON.stringify(body),
		});
	},

	/** Move an upcoming item after `afterItemId`; null = right after the current item. */
	moveItem(
		itemId: string,
		afterItemId: string | null,
		target: QueueCallTarget = {}
	): Promise<QueueState> {
		return apiRequest<QueueState>(`${base(target)}/items/${encodeURIComponent(itemId)}/move`, {
			method: 'POST',
			body: JSON.stringify({ afterItemId }),
		});
	},

	/** Remove an item; removing the current one makes the next item current. */
	removeItem(itemId: string, target: QueueCallTarget = {}): Promise<QueueState> {
		return apiRequest<QueueState>(`${base(target)}/items/${encodeURIComponent(itemId)}`, {
			method: 'DELETE',
		});
	},

	/** Make an item current. */
	playItem(itemId: string, target: QueueCallTarget = {}): Promise<QueueState> {
		return apiRequest<QueueState>(`${base(target)}/items/${encodeURIComponent(itemId)}/play`, {
			method: 'POST',
			...deviceBody(target),
		});
	},

	/**
	 * Queue a playlist's tracks as one block right after the current item and
	 * make its first track current. 409 `PLAYLIST_EMPTY`, 403 / 404 throw.
	 */
	playPlaylist(playlistId: string, target: QueueCallTarget = {}): Promise<QueueState> {
		return apiRequest<QueueState>(
			`${base(target)}/playlists/${encodeURIComponent(playlistId)}/play`,
			{ method: 'POST', ...deviceBody(target) }
		);
	},

	/** Play on a device of mine or of a friend (#295); 403 / 409 `DEVICE_OFFLINE` throw. */
	transfer(body: TransferRequest): Promise<TransferResult> {
		return apiRequest<TransferResult>('/api/queue/transfer', {
			method: 'POST',
			body: JSON.stringify(body),
		});
	},
};
