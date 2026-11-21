import type {
	EventDraft,
	EventFormInput,
} from '@/features/events/features/event-form/types/eventFormTypes';
import type { Coordinates, EventInput } from '@/features/events/eventTypes';

function orNull(text: string) {
	return text.trim() || null;
}

export function toEventInput(
	data: EventFormInput,
	draft: EventDraft,
	coordinates: Coordinates
): EventInput {
	return {
		name: data.name.trim(),
		description: orNull(data.description),
		address: data.address.trim(),
		...coordinates,
		accessInfo: orNull(data.accessInfo),
		genres: draft.genres,
		startsAt: draft.startsAt.toISOString(),
		endsAt: draft.endsAt.toISOString(),
		playlistId: draft.playlistId,
	};
}
