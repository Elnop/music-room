import { showError } from '@/shared/theme/lib/toast';
import { scheduleError } from '@/features/events/shared/event-dates/eventDates';
import { useSaveEvent } from '@/features/events/features/event-form/hooks/useSaveEvent';
import { toEventInput } from '@/features/events/features/event-form/lib/toEventInput';
import type {
	EventDraft,
	EventFormInput,
	EventFormNavigation,
	EventPlace,
} from '@/features/events/features/event-form/types/eventFormTypes';

type EventSubmitArgs = {
	navigation: EventFormNavigation;
	eventId: string | undefined;
	place: EventPlace;
	draft: EventDraft;
};

function draftIsValid(draft: EventDraft): boolean {
	if (!draft.requireGenres()) return false;
	const invalidSchedule = scheduleError(draft.startsAt, draft.endsAt);
	if (invalidSchedule) showError(invalidSchedule);
	return !invalidSchedule;
}

export function useEventSubmit({ navigation, eventId, place, draft }: EventSubmitArgs) {
	const save = useSaveEvent(navigation, eventId);

	return async function onSubmit(data: EventFormInput) {
		if (!draftIsValid(draft)) return;
		const coordinates = await place.resolve(data.address);
		if (!coordinates) return;
		await save(toEventInput(data, draft, coordinates));
	};
}
