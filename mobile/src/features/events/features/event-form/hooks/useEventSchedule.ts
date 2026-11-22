import { useState } from 'react';
import { defaultSchedule } from '@/features/events/shared/event-dates/eventDates';
import { pickDateTime } from '@/features/events/features/event-form/lib/pickDateTime';
import type { EventSchedule } from '@/features/events/features/event-form/types/eventFormTypes';
import type { MusicEvent } from '@/features/events/eventTypes';

export function useEventSchedule(edited: MusicEvent | undefined): EventSchedule {
	const [schedule] = useState(defaultSchedule);
	const [startsAt, setStartsAt] = useState(() =>
		edited ? new Date(edited.startsAt) : schedule.startsAt,
	);
	const [endsAt, setEndsAt] = useState(() => (edited ? new Date(edited.endsAt) : schedule.endsAt));

	function moveStart(date: Date) {
		const length = endsAt.getTime() - startsAt.getTime();
		setStartsAt(date);
		if (endsAt.getTime() <= date.getTime()) setEndsAt(new Date(date.getTime() + length));
	}

	return {
		startsAt,
		endsAt,
		pickStart: () => void pickDateTime(startsAt).then((date) => date && moveStart(date)),
		pickEnd: () => void pickDateTime(endsAt).then((date) => date && setEndsAt(date)),
	};
}
