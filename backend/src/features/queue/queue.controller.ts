import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { sendSuccess } from '@/shared/utils/send-success.js';
import * as queueService from '@/features/queue/services/queue.service.js';
import * as queueTransferService from '@/features/queue/services/queue-transfer.service.js';
import {
	addQueueItemBodySchema,
	moveQueueItemSchema,
	queueItemParamsSchema,
	queueOwnerParamsSchema,
	queuePlaybackSchema,
	queuePlaylistParamsSchema,
	transferSchema,
} from '@/features/queue/queue.validators.js';
import type { QueueStepDirection } from '@/features/queue/queue.types.js';

// Play queue: every route answers the full queue state of its owner, the
// caller or `:userId` (#294).

const actorOf = (req: Request) => (req as AuthenticatedRequest).user.id;

/** The queue owner: `:userId` on /api/users/:userId/queue, else the caller. */
const ownerOf = (req: Request) => queueOwnerParamsSchema.parse(req.params).userId ?? actorOf(req);

/** GET /api/queue */
export async function getQueue(req: Request, res: Response) {
	sendSuccess(res, await queueService.getQueue(actorOf(req), ownerOf(req)));
}

/** POST /api/queue/items */
export async function addItem(req: Request, res: Response) {
	const { next: playNext, ...track } = addQueueItemBodySchema.parse(req.body);
	sendSuccess(
		res,
		await queueService.addItem(actorOf(req), ownerOf(req), track, { next: playNext })
	);
}

/** DELETE /api/queue/items/:itemId */
export async function removeItem(req: Request, res: Response) {
	const { itemId } = queueItemParamsSchema.parse(req.params);
	sendSuccess(res, await queueService.removeItem(actorOf(req), ownerOf(req), itemId));
}

/** POST /api/queue/items/:itemId/move */
export async function moveItem(req: Request, res: Response) {
	const { itemId } = queueItemParamsSchema.parse(req.params);
	const { afterItemId } = moveQueueItemSchema.parse(req.body);
	sendSuccess(res, await queueService.moveItem(actorOf(req), ownerOf(req), itemId, afterItemId));
}

/** POST /api/queue/items/:itemId/play */
export async function playItem(req: Request, res: Response) {
	const { itemId } = queueItemParamsSchema.parse(req.params);
	const { deviceId } = queuePlaybackSchema.parse(req.body);
	sendSuccess(res, await queueService.playItem(actorOf(req), ownerOf(req), itemId, deviceId));
}

/** POST /api/queue/playlists/:playlistId/play */
export async function playPlaylist(req: Request, res: Response) {
	const { playlistId } = queuePlaylistParamsSchema.parse(req.params);
	const { deviceId } = queuePlaybackSchema.parse(req.body);
	sendSuccess(
		res,
		await queueService.playPlaylist(actorOf(req), ownerOf(req), playlistId, deviceId)
	);
}

async function step(req: Request, res: Response, direction: QueueStepDirection) {
	const { deviceId } = queuePlaybackSchema.parse(req.body);
	sendSuccess(res, await queueService.step(actorOf(req), ownerOf(req), direction, deviceId));
}

/** POST /api/queue/next */
export const stepNext = (req: Request, res: Response) => step(req, res, 'next');

/** POST /api/queue/previous */
export const stepPrevious = (req: Request, res: Response) => step(req, res, 'previous');

/** POST /api/queue/transfer: always from the caller, never under /api/users/:userId/queue */
export async function transfer(req: Request, res: Response) {
	const input = transferSchema.parse(req.body);
	sendSuccess(res, await queueTransferService.transfer(actorOf(req), input));
}
