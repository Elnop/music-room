import { queryKeys } from '@/shared/query-keys/queryKeys';
import type { EventDeletedPayload, MusicEvent } from '@/features/events/eventTypes';

export const eventSocketKeys = {
	updatedDetail: (event: MusicEvent) => queryKeys.events.detail(event.id),
	deletedDetail: (payload: EventDeletedPayload) => queryKeys.events.detail(payload.eventId),
};
