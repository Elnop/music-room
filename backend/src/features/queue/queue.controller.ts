import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest, ApiResponse } from '@/shared/types/global.types.js';
import { queueService } from '@/features/queue/services/queue.service.js';
import {
	addQueueItemSchema,
	moveQueueItemSchema,
	queueItemParamsSchema,
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

const userIdOf = (req: Request) => (req as AuthenticatedRequest).user.id;

/**
 * Play queue controller: every route answers the caller's full queue state.
 */
export class QueueController {
	/** GET /api/queue */
	async getQueue(req: Request, res: Response, next: NextFunction) {
		try {
			sendState(res, await queueService.getQueue(userIdOf(req)));
		} catch (error) {
			next(error);
		}
	}

	/** POST /api/queue/items */
	async addItem(req: Request, res: Response, next: NextFunction) {
		try {
			const track = addQueueItemSchema.parse(req.body);
			sendState(res, await queueService.addItem(userIdOf(req), track));
		} catch (error) {
			next(error);
		}
	}

	/** DELETE /api/queue/items/:itemId */
	async removeItem(req: Request, res: Response, next: NextFunction) {
		try {
			const { itemId } = queueItemParamsSchema.parse(req.params);
			sendState(res, await queueService.removeItem(userIdOf(req), itemId));
		} catch (error) {
			next(error);
		}
	}

	/** POST /api/queue/items/:itemId/move */
	async moveItem(req: Request, res: Response, next: NextFunction) {
		try {
			const { itemId } = queueItemParamsSchema.parse(req.params);
			const { afterItemId } = moveQueueItemSchema.parse(req.body);
			sendState(res, await queueService.moveItem(userIdOf(req), itemId, afterItemId));
		} catch (error) {
			next(error);
		}
	}

	/** POST /api/queue/items/:itemId/play */
	async playItem(req: Request, res: Response, next: NextFunction) {
		try {
			const { itemId } = queueItemParamsSchema.parse(req.params);
			sendState(res, await queueService.playItem(userIdOf(req), itemId));
		} catch (error) {
			next(error);
		}
	}

	/** POST /api/queue/playlists/:playlistId/play */
	async playPlaylist(req: Request, res: Response, next: NextFunction) {
		try {
			const { playlistId } = queuePlaylistParamsSchema.parse(req.params);
			sendState(res, await queueService.playPlaylist(userIdOf(req), playlistId));
		} catch (error) {
			next(error);
		}
	}

	/** POST /api/queue/next and /api/queue/previous */
	step(direction: QueueStepDirection) {
		return async (req: Request, res: Response, next: NextFunction) => {
			try {
				sendState(res, await queueService.step(userIdOf(req), direction));
			} catch (error) {
				next(error);
			}
		};
	}
}

export const queueController = new QueueController();
