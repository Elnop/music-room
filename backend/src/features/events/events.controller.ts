import type { Request, Response } from 'express';
import * as eventService from '@/features/events/services/event.service.js';
import * as eventQueryService from '@/features/events/services/event-query.service.js';
import {
	createEventSchema,
	eventIdParamSchema,
	updateEventSchema,
} from '@/features/events/events.validators.js';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { sendSuccess } from '@/shared/utils/send-success.js';

export async function listEvents(_req: Request, res: Response) {
	sendSuccess(res, { events: await eventQueryService.listActiveEvents() });
}

export async function getEvent(req: Request, res: Response) {
	const { id } = eventIdParamSchema.parse(req.params);
	sendSuccess(res, { event: await eventQueryService.getEvent(id) });
}

export async function createEvent(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const input = createEventSchema.parse(req.body);
	sendSuccess(res, { event: await eventService.createEvent(userId, input) }, 201);
}

export async function updateEvent(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const { id } = eventIdParamSchema.parse(req.params);
	const input = updateEventSchema.parse(req.body);
	sendSuccess(res, { event: await eventService.updateEvent(id, userId, input) });
}

export async function deleteEvent(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const { id } = eventIdParamSchema.parse(req.params);
	await eventService.deleteEvent(id, userId);
	sendSuccess(res, { id });
}
