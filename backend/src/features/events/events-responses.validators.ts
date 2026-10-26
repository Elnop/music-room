import { z } from 'zod';
import { musicGenreSchema } from '@/shared/music/genres.js';
import { userSummarySchema } from '@/shared/users/user-summary.js';

const eventPlaylistSchema = z
	.object({ id: z.uuid(), name: z.string(), coverUrl: z.url().optional() })
	.meta({ description: 'The linked playlist; null when none, or when it is no longer public' });

export const eventSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	description: z.string().optional(),
	address: z.string(),
	latitude: z.number().meta({ example: 48.8966 }),
	longitude: z.number().meta({ example: 2.3185 }),
	accessInfo: z.string().optional(),
	genres: z.array(musicGenreSchema),
	startsAt: z.iso.datetime({ offset: true }),
	endsAt: z.iso.datetime({ offset: true }),
	beaconMinor: z.int().min(1).max(65535).meta({
		description: 'Minor of the iBeacon frame the organiser broadcasts; unique among events',
	}),
	organizer: userSummarySchema.meta({ description: 'The user who created the event' }),
	playlist: eventPlaylistSchema.nullable(),
	createdAt: z.iso.datetime({ offset: true }),
	updatedAt: z.iso.datetime({ offset: true }),
});

export const eventResponseSchema = z.object({ event: eventSchema });
export const eventListResponseSchema = z.object({ events: z.array(eventSchema) });
export const eventDeletedResponseSchema = z.object({ id: z.uuid() });
