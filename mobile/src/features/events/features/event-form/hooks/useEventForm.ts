import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import { usePlaylistChoices } from '@/features/events/shared/events/hooks/useEventQueries';
import { useEventDraft } from '@/features/events/features/event-form/hooks/useEventDraft';
import { useEventFields } from '@/features/events/features/event-form/hooks/useEventFields';
import { useEventSubmit } from '@/features/events/features/event-form/hooks/useEventSubmit';
import type {
	EventForm,
	EventFormNavigation,
} from '@/features/events/features/event-form/types/eventFormTypes';
import type { MusicEvent } from '@/features/events/eventTypes';

function useEditedEvent(eventId: string | undefined): MusicEvent | undefined {
	const client = useQueryClient();
	const [edited] = useState(() =>
		eventId === undefined
			? undefined
			: (client.getQueryData<MusicEvent>(queryKeys.events.detail(eventId)) ??
				client.getQueryData<MusicEvent[]>(queryKeys.events.list())?.find((e) => e.id === eventId)),
	);
	return edited;
}

export function useEventForm(
	navigation: EventFormNavigation,
	eventId: string | undefined,
): EventForm {
	const edited = useEditedEvent(eventId);
	const draft = useEventDraft(edited);
	const entry = useEventFields(edited);
	const playlists = usePlaylistChoices(true);
	const onSubmit = useEventSubmit({ navigation, eventId, place: entry.place, draft });

	return {
		isEditing: eventId !== undefined,
		...entry.fields,
		place: entry.place,
		...draft,
		playlists: playlists.data ?? [],
		submit: entry.form.handleSubmit(onSubmit),
		isSubmitting: entry.form.formState.isSubmitting,
	};
}
