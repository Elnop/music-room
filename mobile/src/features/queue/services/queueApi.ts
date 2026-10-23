import { ApiError, apiRequest } from '@/shared/services/api';
import type {
	QueueCallTarget,
	QueueState,
	QueueStepBoundary,
	QueueStepResult,
	TransferRequest,
	TransferResult,
} from '@/features/queue/types';
import type { AddQueueItemBody } from '@/shared/types/playback';

const base = ({ ownerId }: QueueCallTarget = {}): string =>
	ownerId ? `/api/users/${encodeURIComponent(ownerId)}/queue` : '/api/queue';

const deviceBody = ({ deviceId }: QueueCallTarget = {}): { body?: string } =>
	deviceId ? { body: JSON.stringify({ deviceId }) } : {};

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
	getQueue(target: QueueCallTarget = {}): Promise<QueueState> {
		return apiRequest<QueueState>(base(target));
	},

	next(target: QueueCallTarget = {}): Promise<QueueStepResult> {
		return step(`${base(target)}/next`, 'QUEUE_END', target);
	},

	previous(target: QueueCallTarget = {}): Promise<QueueStepResult> {
		return step(`${base(target)}/previous`, 'QUEUE_START', target);
	},

	addItem(body: AddQueueItemBody, target: QueueCallTarget = {}): Promise<QueueState> {
		return apiRequest<QueueState>(`${base(target)}/items`, {
			method: 'POST',
			body: JSON.stringify(body),
		});
	},

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

	removeItem(itemId: string, target: QueueCallTarget = {}): Promise<QueueState> {
		return apiRequest<QueueState>(`${base(target)}/items/${encodeURIComponent(itemId)}`, {
			method: 'DELETE',
		});
	},

	playItem(itemId: string, target: QueueCallTarget = {}): Promise<QueueState> {
		return apiRequest<QueueState>(`${base(target)}/items/${encodeURIComponent(itemId)}/play`, {
			method: 'POST',
			...deviceBody(target),
		});
	},

	/** `startTrackId`: the track of the playlist to start on; the first one without it. */
	playPlaylist(
		playlistId: string,
		target: QueueCallTarget = {},
		startTrackId?: string
	): Promise<QueueState> {
		const body = {
			...(target.deviceId ? { deviceId: target.deviceId } : {}),
			...(startTrackId ? { startTrackId } : {}),
		};
		return apiRequest<QueueState>(
			`${base(target)}/playlists/${encodeURIComponent(playlistId)}/play`,
			{ method: 'POST', ...(Object.keys(body).length ? { body: JSON.stringify(body) } : {}) }
		);
	},

	transfer(body: TransferRequest): Promise<TransferResult> {
		return apiRequest<TransferResult>('/api/queue/transfer', {
			method: 'POST',
			body: JSON.stringify(body),
		});
	},
};
