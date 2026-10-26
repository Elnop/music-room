import { Router, type RequestHandler } from 'express';
import * as events from '@/features/events/events.controller.js';
import { eventRateLimiter } from '@/shared/security/http-rate-limit.js';

/** `auth` is authMiddleware, passed in by app/routes.ts since a feature never imports another one. */
export function createEventsRouter(auth: RequestHandler): Router {
	const router = Router();

	router.use(auth);

	router.get('/', events.listEvents);
	router.post('/', eventRateLimiter, events.createEvent);
	router.get('/:id', events.getEvent);
	router.patch('/:id', eventRateLimiter, events.updateEvent);
	router.delete('/:id', eventRateLimiter, events.deleteEvent);

	return router;
}
