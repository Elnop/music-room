import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
	createEventSchema,
	eventIdParamSchema,
	updateEventSchema,
} from '@/features/events/events.validators.js';
import {
	eventDeletedResponseSchema,
	eventListResponseSchema,
	eventResponseSchema,
	eventSchema,
} from '@/features/events/events-responses.validators.js';
import { bearerAuth, jsonBody, nameSchemas, ok } from '@/shared/config/swagger.schemas.js';
import { fail, shared } from '@/shared/config/swagger.errors.js';

const example = {
	name: 'Rooftop Friday',
	description: 'House and disco until late',
	address: '96 boulevard Bessières, 75017 Paris',
	latitude: 48.8966,
	longitude: 2.3185,
	accessInfo: 'Building C, 7th floor, ring "Zumik"',
	genres: ['electronic', 'rnb'],
	startsAt: '2026-11-06T20:00:00Z',
	endsAt: '2026-11-07T02:00:00Z',
	playlistId: null,
};

const notOrganiser = ['EVENT_ACCESS_DENIED', 'Only the organiser can change this event'] as [
	string,
	string,
];
const notFound = fail('EVENT_NOT_FOUND', ['EVENT_NOT_FOUND', 'Event not found']);
const badPlaylist = [
	'EVENT_PLAYLIST_INVALID',
	'The linked playlist must be one of your public playlists',
] as [string, string];

export function registerEventsOpenapi(registry: OpenAPIRegistry): void {
	const common = { tags: ['Events'], security: bearerAuth };
	const limited = { 429: shared('RateLimitError'), 503: shared('RateLimitUnavailable') };
	nameSchemas({
		Event: eventSchema,
		CreateEventRequest: createEventSchema,
		UpdateEventRequest: updateEventSchema,
	});

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/events',
		summary: 'List ongoing and upcoming events',
		description:
			'Every event whose end has not passed, by start date, with its coordinates and `beaconMinor`. The phone computes the distance itself: the request carries no position.',
		operationId: 'listEvents',
		responses: {
			200: ok('Ongoing and upcoming events', eventListResponseSchema),
			401: shared('UnauthorizedError'),
		},
	});

	registry.registerPath({
		...common,
		method: 'post',
		path: '/api/events',
		summary: 'Create an event',
		description:
			'Any user creates a public event. The server picks a free `beaconMinor`. Every connected client receives `event:created`. Rate-limited per user, shared with PATCH and DELETE.',
		operationId: 'createEvent',
		request: { body: jsonBody(createEventSchema, example) },
		responses: {
			201: ok('Event created', eventResponseSchema),
			400: fail(
				'VALIDATION_ERROR: invalid field. EVENT_PLAYLIST_INVALID: the playlist is not one of your public playlists',
				badPlaylist
			),
			401: shared('UnauthorizedError'),
			...limited,
		},
	});

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/events/{id}',
		summary: 'Get an event',
		description:
			'Also returns an ended event. `playlist` is null once the playlist is no longer public.',
		operationId: 'getEvent',
		request: { params: eventIdParamSchema },
		responses: {
			200: ok('The event', eventResponseSchema),
			400: shared('ValidationError'),
			401: shared('UnauthorizedError'),
			404: notFound,
		},
	});

	registry.registerPath({
		...common,
		method: 'patch',
		path: '/api/events/{id}',
		summary: 'Update an event',
		description:
			'Organiser only. Send only the fields to change; `null` clears `description`, `accessInfo` or `playlistId`. Every connected client receives `event:updated`.',
		operationId: 'updateEvent',
		request: {
			params: eventIdParamSchema,
			body: jsonBody(updateEventSchema, { accessInfo: 'Side door, code 4512' }),
		},
		responses: {
			200: ok('Event updated', eventResponseSchema),
			400: fail(
				'VALIDATION_ERROR: invalid field. EVENT_DATES_INVALID: the end would be before the start. EVENT_PLAYLIST_INVALID: the playlist is not one of your public playlists',
				['EVENT_DATES_INVALID', 'The end must be after the start'],
				badPlaylist
			),
			401: shared('UnauthorizedError'),
			403: fail('EVENT_ACCESS_DENIED: not the organiser', notOrganiser),
			404: notFound,
			...limited,
		},
	});

	registry.registerPath({
		...common,
		method: 'delete',
		path: '/api/events/{id}',
		summary: 'Delete an event',
		description:
			'Organiser only. Every connected client receives `event:deleted` with `{ eventId }`.',
		operationId: 'deleteEvent',
		request: { params: eventIdParamSchema },
		responses: {
			200: ok('Event deleted', eventDeletedResponseSchema),
			400: shared('ValidationError'),
			401: shared('UnauthorizedError'),
			403: fail('EVENT_ACCESS_DENIED: not the organiser', notOrganiser),
			404: notFound,
			...limited,
		},
	});
}
