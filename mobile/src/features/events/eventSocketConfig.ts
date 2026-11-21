import { queryKeys } from '@/shared/query-keys/queryKeys';
import { eventSocketKeys } from '@/features/events/eventSocketKeys';
import { socketCacheRule } from '@/shared/backend/lib/socketCache';
import { removeEvent, upsertEvent } from '@/features/events/shared/events/lib/eventCache';
import type { EventDeletedPayload, MusicEvent } from '@/features/events/eventTypes';

function listUpsert(event: 'event:created' | 'event:updated') {
	return socketCacheRule<MusicEvent, MusicEvent[]>({
		event,
		queryKey: queryKeys.events.list,
		update: (list, payload) => upsertEvent(list, payload),
	});
}

export const EVENT_SOCKET_RULES = [
	listUpsert('event:created'),
	listUpsert('event:updated'),
	socketCacheRule<MusicEvent, MusicEvent>({
		event: 'event:updated',
		queryKey: eventSocketKeys.updatedDetail,
		update: (_current, payload) => payload,
	}),
	socketCacheRule<EventDeletedPayload, MusicEvent[]>({
		event: 'event:deleted',
		queryKey: queryKeys.events.list,
		update: (list, payload) => removeEvent(list, payload.eventId),
	}),
	socketCacheRule<EventDeletedPayload, MusicEvent>({
		event: 'event:deleted',
		queryKey: eventSocketKeys.deletedDetail,
	}),
] as const;
