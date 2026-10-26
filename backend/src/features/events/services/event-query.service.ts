import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { failUnexpected } from '@/shared/utils/fail-unexpected.js';
import { EVENT_COLUMNS, toEvent } from '@/features/events/utils/event-mapper.js';
import type { Event, EventRowWithRelations } from '@/features/events/events.types.js';

/** Ongoing and upcoming events; the phone filters them by distance itself. */
export function listActiveEvents(): Promise<Event[]> {
	return failUnexpected(
		async () => {
			const { data, error } = await supabaseAdmin
				.from('events')
				.select(EVENT_COLUMNS)
				.gt('ends_at', new Date().toISOString())
				.order('starts_at', { ascending: true })
				.overrideTypes<EventRowWithRelations[], { merge: false }>();
			if (error) throw error;
			return data.map(toEvent);
		},
		'Failed to list events',
		'Failed to list events',
		'EVENT_LIST_ERROR'
	);
}

export function getEvent(eventId: string): Promise<Event> {
	return failUnexpected(
		async () => {
			const { data, error } = await supabaseAdmin
				.from('events')
				.select(EVENT_COLUMNS)
				.eq('id', eventId)
				.maybeSingle()
				.overrideTypes<EventRowWithRelations, { merge: false }>();
			if (error) throw error;
			if (!data) throw new AppError(404, 'Event not found', 'EVENT_NOT_FOUND');
			return toEvent(data);
		},
		'Failed to fetch event',
		'Failed to fetch event',
		'EVENT_FETCH_ERROR'
	);
}
