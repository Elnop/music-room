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
	queuePlayPlaylistSchema,
	queuePlaylistParamsSchema,
	transferSchema,
} from '@/features/queue/queue.validators.js';
import type { QueueStepDirection } from '@/features/queue/queue.types.js';

// Every route answers the full queue state of its owner: the caller, or `:userId`.

const actorOf = (req: Request) => (req as AuthenticatedRequest).user.id;

const ownerOf = (req: Request) => queueOwnerParamsSchema.parse(req.params).userId ?? actorOf(req);

export async function getQueue(req: Request, res: Response) {
	sendSuccess(res, await queueService.getQueue(actorOf(req), ownerOf(req)));
}

export async function addItem(req: Request, res: Response) {
	const { next: playNext, ...track } = addQueueItemBodySchema.parse(req.body);
	sendSuccess(
		res,
		await queueService.addItem(actorOf(req), ownerOf(req), track, { next: playNext })
	);
}

export async function removeItem(req: Request, res: Response) {
	const { itemId } = queueItemParamsSchema.parse(req.params);
	sendSuccess(res, await queueService.removeItem(actorOf(req), ownerOf(req), itemId));
}

export async function moveItem(req: Request, res: Response) {
	const { itemId } = queueItemParamsSchema.parse(req.params);
	const { afterItemId } = moveQueueItemSchema.parse(req.body);
	sendSuccess(res, await queueService.moveItem(actorOf(req), ownerOf(req), itemId, afterItemId));
}

export async function playItem(req: Request, res: Response) {
	const { itemId } = queueItemParamsSchema.parse(req.params);
	const { deviceId } = queuePlaybackSchema.parse(req.body);
	sendSuccess(res, await queueService.playItem(actorOf(req), ownerOf(req), itemId, deviceId));
}

export async function playPlaylist(req: Request, res: Response) {
	const { playlistId } = queuePlaylistParamsSchema.parse(req.params);
	const { deviceId, startTrackId } = queuePlayPlaylistSchema.parse(req.body);
	sendSuccess(
		res,
		await queueService.playPlaylist(actorOf(req), ownerOf(req), playlistId, deviceId, startTrackId)
	);
}

async function step(req: Request, res: Response, direction: QueueStepDirection) {
	const { deviceId } = queuePlaybackSchema.parse(req.body);
	sendSuccess(res, await queueService.step(actorOf(req), ownerOf(req), direction, deviceId));
}

export const stepNext = (req: Request, res: Response) => step(req, res, 'next');

export const stepPrevious = (req: Request, res: Response) => step(req, res, 'previous');

/** Always from the caller, never under /api/users/:userId/queue. */
export async function transfer(req: Request, res: Response) {
	const input = transferSchema.parse(req.body);
	sendSuccess(res, await queueTransferService.transfer(actorOf(req), input));
}
