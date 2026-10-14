import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest, ApiResponse } from '@/shared/types/global.types.js';
import { queueService } from '@/features/queue/services/queue.service.js';
import {
	addQueueItemSchema,
	moveQueueItemSchema,
	queueItemParamsSchema,
	queueOwnerParamsSchema,
	queuePlaybackSchema,
	queuePlaylistParamsSchema,
} from '@/features/queue/queue.validators.js';
import type { QueueState, QueueStepDirection } from '@/features/queue/queue.types.js';

function sendState(res: Response, data: QueueState) {
	const response: ApiResponse<QueueState> = {
		success: true,
		data,
		meta: { timestamp: new Date().toISOString() },
	};
	res.status(200).json(response);
}

const actorOf = (req: Request) => (req as AuthenticatedRequest).user.id;

/** The queue owner: `:userId` on /api/users/:userId/queue, else the caller. */
const ownerOf = (req: Request) => queueOwnerParamsSchema.parse(req.params).userId ?? actorOf(req);

/**
 * Play queue controller: every route answers the full queue state of its owner, the caller or `:userId` (#294).
 */
export class QueueController {
	/** GET /api/queue */
	async getQueue(req: Request, res: Response, next: NextFunction) {
		try {
			sendState(res, await queueService.getQueue(actorOf(req), ownerOf(req)));
		} catch (error) {
			next(error);
		}
	}

	/** POST /api/queue/items */
	async addItem(req: Request, res: Response, next: NextFunction) {
		try {
			const track = addQueueItemSchema.parse(req.body);
			sendState(res, await queueService.addItem(actorOf(req), ownerOf(req), track));
		} catch (error) {
			next(error);
		}
	}

	/** DELETE /api/queue/items/:itemId */
	async removeItem(req: Request, res: Response, next: NextFunction) {
		try {
			const { itemId } = queueItemParamsSchema.parse(req.params);
			sendState(res, await queueService.removeItem(actorOf(req), ownerOf(req), itemId));
		} catch (error) {
			next(error);
		}
	}

	/** POST /api/queue/items/:itemId/move */
	async moveItem(req: Request, res: Response, next: NextFunction) {
		try {
			const { itemId } = queueItemParamsSchema.parse(req.params);
			const { afterItemId } = moveQueueItemSchema.parse(req.body);
			sendState(res, await queueService.moveItem(actorOf(req), ownerOf(req), itemId, afterItemId));
		} catch (error) {
			next(error);
		}
	}

	/** POST /api/queue/items/:itemId/play */
	async playItem(req: Request, res: Response, next: NextFunction) {
		try {
			const { itemId } = queueItemParamsSchema.parse(req.params);
			const { deviceId } = queuePlaybackSchema.parse(req.body);
			sendState(res, await queueService.playItem(actorOf(req), ownerOf(req), itemId, deviceId));
		} catch (error) {
			next(error);
		}
	}

	/** POST /api/queue/playlists/:playlistId/play */
	async playPlaylist(req: Request, res: Response, next: NextFunction) {
		try {
			const { playlistId } = queuePlaylistParamsSchema.parse(req.params);
			const { deviceId } = queuePlaybackSchema.parse(req.body);
			sendState(
				res,
				await queueService.playPlaylist(actorOf(req), ownerOf(req), playlistId, deviceId)
			);
		} catch (error) {
			next(error);
		}
	}

	/** POST /api/queue/next and /api/queue/previous */
	step(direction: QueueStepDirection) {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				const { deviceId } = queuePlaybackSchema.parse(req.body);
				sendState(res, await queueService.step(actorOf(req), ownerOf(req), direction, deviceId));
			} catch (error) {
				next(error);
			}
		};
	}
}

export const queueController = new QueueController();
