import { z } from 'zod';
import { MAX_GENRES, musicGenreSchema } from '@/shared/music/genres.js';

const EVENT_LIMITS = { NAME_MAX: 100, TEXT_MAX: 500, ADDRESS_MAX: 200 };

const endsAfterStart = {
	message: 'The end must be after the start',
	path: ['endsAt'],
};

const eventFields = {
	name: z
		.string()
		.trim()
		.min(1, 'Event name is required')
		.max(EVENT_LIMITS.NAME_MAX, `Event name must be at most ${EVENT_LIMITS.NAME_MAX} characters`),
	description: z
		.string()
		.max(EVENT_LIMITS.TEXT_MAX, `Description must be at most ${EVENT_LIMITS.TEXT_MAX} characters`)
		.nullable(),
	address: z
		.string()
		.trim()
		.min(1, 'Address is required')
		.max(
			EVENT_LIMITS.ADDRESS_MAX,
			`Address must be at most ${EVENT_LIMITS.ADDRESS_MAX} characters`
		),
	latitude: z.number().min(-90).max(90),
	longitude: z.number().min(-180).max(180),
	accessInfo: z
		.string()
		.max(EVENT_LIMITS.TEXT_MAX, `Access info must be at most ${EVENT_LIMITS.TEXT_MAX} characters`)
		.nullable()
		.meta({ description: 'How to get in: entrance, floor, code, transport' }),
	genres: z
		.array(musicGenreSchema)
		.min(1, 'Pick at least one genre')
		.max(MAX_GENRES, `Maximum ${MAX_GENRES} genres allowed`),
	startsAt: z.iso.datetime({ offset: true }),
	endsAt: z.iso.datetime({ offset: true }),
	playlistId: z
		.uuid()
		.nullable()
		.meta({ description: "One of the creator's public playlists, or null" }),
};

export const createEventSchema = z
	.object({
		...eventFields,
		description: eventFields.description.optional(),
		accessInfo: eventFields.accessInfo.optional(),
		playlistId: eventFields.playlistId.optional(),
	})
	.refine(event => Date.parse(event.endsAt) > Date.parse(event.startsAt), endsAfterStart)
	.refine(event => Date.parse(event.endsAt) > Date.now(), {
		message: 'The event is already over',
		path: ['endsAt'],
	});

export const updateEventSchema = z
	.object(eventFields)
	.partial()
	.refine(
		event =>
			!event.startsAt || !event.endsAt || Date.parse(event.endsAt) > Date.parse(event.startsAt),
		endsAfterStart
	);

export const eventIdParamSchema = z.object({ id: z.uuid() });

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
