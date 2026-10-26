import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { failUnexpected } from '@/shared/utils/fail-unexpected.js';
import { logger } from '@/shared/utils/logger.js';
import type { TablesUpdate } from '@/shared/types/supabase.generated.js';
import * as realtime from '@/realtime/emitters/event.emitters.js';
import * as eventQueryService from '@/features/events/services/event-query.service.js';
import {
	assertLinkablePlaylist,
	loadOwnedEvent,
} from '@/features/events/permissions/event.permissions.js';
import { isBeaconMinorTaken, randomBeaconMinor } from '@/features/events/utils/beacon-minor.js';
import type { CreateEventInput, UpdateEventInput } from '@/features/events/events.validators.js';
import type { Event } from '@/features/events/events.types.js';

const MINOR_ATTEMPTS = 8;

function toColumns(input: UpdateEventInput): TablesUpdate<'events'> {
	const columns: TablesUpdate<'events'> = {
		name: input.name,
		description: input.description,
		address: input.address,
		latitude: input.latitude,
		longitude: input.longitude,
		access_info: input.accessInfo,
		genres: input.genres,
		starts_at: input.startsAt,
		ends_at: input.endsAt,
		playlist_id: input.playlistId,
	};
	return Object.fromEntries(Object.entries(columns).filter(([, value]) => value !== undefined));
}

async function insertWithFreeMinor(ownerId: string, input: CreateEventInput): Promise<string> {
	for (let attempt = 0; attempt < MINOR_ATTEMPTS; attempt++) {
		const { data, error } = await supabaseAdmin
			.from('events')
			.insert({
				...toColumns(input),
				owner_id: ownerId,
				name: input.name,
				address: input.address,
				latitude: input.latitude,
				longitude: input.longitude,
				starts_at: input.startsAt,
				ends_at: input.endsAt,
				beacon_minor: randomBeaconMinor(),
			})
			.select('id')
			.single();
		if (!error) return data.id;
		if (!isBeaconMinorTaken(error)) throw error;
	}
	throw new AppError(
		503,
		'No beacon identifier is free, try again later',
		'EVENT_BEACON_EXHAUSTED'
	);
}

export function createEvent(userId: string, input: CreateEventInput): Promise<Event> {
	return failUnexpected(
		async () => {
			if (input.playlistId) await assertLinkablePlaylist(input.playlistId, userId);
			const eventId = await insertWithFreeMinor(userId, input);
			const event = await eventQueryService.getEvent(eventId);
			realtime.notifyEventCreated(event);
			logger.info('Event created', { eventId, userId });
			return event;
		},
		'Failed to create event',
		'Failed to create event',
		'EVENT_CREATE_ERROR'
	);
}

export function updateEvent(
	eventId: string,
	userId: string,
	input: UpdateEventInput
): Promise<Event> {
	return failUnexpected(
		async () => {
			const current = await loadOwnedEvent(eventId, userId);
			const startsAt = Date.parse(input.startsAt ?? current.starts_at);
			const endsAt = Date.parse(input.endsAt ?? current.ends_at);
			if (endsAt <= startsAt) {
				throw new AppError(400, 'The end must be after the start', 'EVENT_DATES_INVALID');
			}
			if (input.playlistId) await assertLinkablePlaylist(input.playlistId, userId);

			const { error } = await supabaseAdmin
				.from('events')
				.update(toColumns(input))
				.eq('id', eventId);
			if (error) throw error;

			const event = await eventQueryService.getEvent(eventId);
			realtime.notifyEventUpdated(event);
			logger.info('Event updated', { eventId, userId });
			return event;
		},
		'Failed to update event',
		'Failed to update event',
		'EVENT_UPDATE_ERROR'
	);
}

export function deleteEvent(eventId: string, userId: string): Promise<void> {
	return failUnexpected(
		async () => {
			await loadOwnedEvent(eventId, userId);
			const { error } = await supabaseAdmin.from('events').delete().eq('id', eventId);
			if (error) throw error;
			realtime.notifyEventDeleted({ eventId });
			logger.info('Event deleted', { eventId, userId });
		},
		'Failed to delete event',
		'Failed to delete event',
		'EVENT_DELETE_ERROR'
	);
}
