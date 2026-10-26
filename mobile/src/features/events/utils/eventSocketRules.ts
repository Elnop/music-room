import { queryKeys } from '@/shared/query/keys';
import { socketCacheRule } from '@/shared/query/socketCache';
import { removeEvent, upsertEvent } from '@/features/events/utils/eventCache';
import type { EventDeletedPayload, MusicEvent } from '@/features/events/types';

// Events are public: the backend sends these to every connected socket (realtime/emitters/event.emitters.ts).

const listUpsert = (event: 'event:created' | 'event:updated') =>
	socketCacheRule<MusicEvent, MusicEvent[]>({
		event,
		queryKey: () => queryKeys.events.list(),
		update: (list, payload) => upsertEvent(list, payload),
	});

export const EVENT_SOCKET_RULES = [
	listUpsert('event:created'),
	listUpsert('event:updated'),
	socketCacheRule<MusicEvent, MusicEvent>({
		event: 'event:updated',
		queryKey: payload => queryKeys.events.detail(payload.id),
		update: (_current, payload) => payload,
	}),
	socketCacheRule<EventDeletedPayload, MusicEvent[]>({
		event: 'event:deleted',
		queryKey: () => queryKeys.events.list(),
		update: (list, payload) => removeEvent(list, payload.eventId),
	}),
	// No update: the detail refetches and gets a 404, which closes its screen.
	socketCacheRule<EventDeletedPayload, MusicEvent>({
		event: 'event:deleted',
		queryKey: payload => queryKeys.events.detail(payload.eventId),
	}),
] as const;
