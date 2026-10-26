import { socketLogger } from '@/shared/middleware/socket-logger.middleware.js';
import type { Event, EventDeletedPayload } from '@/features/events/events.types.js';
import { getIO } from '@/realtime/state.js';

// Events are public: every connected client receives them. No-op (logged) before initialize().

type EventBroadcast = 'event:created' | 'event:updated' | 'event:deleted';

function broadcast(name: EventBroadcast, payload: Event | EventDeletedPayload): void {
	const eventId = 'eventId' in payload ? payload.eventId : payload.id;
	const io = getIO();
	if (!io) {
		socketLogger.event(name, 'N/A', { level: 'warn', eventId, action: 'not_initialized' });
		return;
	}

	io.emit(name, payload);
	socketLogger.broadcast(name.replace(':', '_'), { eventId, action: 'broadcasted' });
}

export function notifyEventCreated(event: Event): void {
	broadcast('event:created', event);
}

export function notifyEventUpdated(event: Event): void {
	broadcast('event:updated', event);
}

export function notifyEventDeleted(payload: EventDeletedPayload): void {
	broadcast('event:deleted', payload);
}
