import { z } from 'zod';

/** A playlist member; displayName and avatarUrl are absent when the profile has none. */
export const playlistMemberSchema = z.object({
	id: z.uuid(),
	username: z.string(),
	displayName: z.string().optional(),
	avatarUrl: z.url().optional(),
});

const visibilitySchema = z.enum(['public', 'private']);
const editModeSchema = z.enum(['open', 'restricted']);

export const playlistSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	description: z.string().optional(),
	coverUrl: z.url().optional(),
	firstTrackCover: z
		.url()
		.optional()
		.meta({ description: 'Album art of the first track by rank, when it has one' }),
	ownerId: z.uuid(),
	owner: playlistMemberSchema.optional(),
	collaboratorIds: z.array(z.uuid()),
	viewerIds: z.array(z.uuid()),
	visibility: visibilitySchema,
	editMode: editModeSchema.meta({
		description: 'open (anyone with access can edit) or restricted (only collaborators)',
	}),
	trackCount: z.int().meta({ example: 10 }),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

const tracksVersionSchema = z.int().meta({
	description: 'Incremented by every add, remove and move; sent back as expectedVersion',
	example: 10,
});

const rebalancedSchema = z.boolean().meta({ description: 'Every rank of the playlist changed' });

export const playlistTrackSchema = z.object({
	id: z.uuid(),
	trackUri: z.string().meta({ description: 'SoundCloud permalink URL' }),
	title: z.string(),
	artist: z.string(),
	album: z.string().optional(),
	albumArt: z.url().optional(),
	durationMs: z.int(),
	previewUrl: z.url().optional(),
	unavailable: z.boolean().meta({
		description: 'Deleted, private or blocked on SoundCloud: cannot be played or queued',
	}),
	rank: z.string().meta({
		description: 'Sort key: tracks are ordered by rank, compared byte by byte',
		example: 'h',
	}),
	addedBy: z.uuid().nullable().meta({ description: 'ID of the user who added the track' }),
	addedAt: z.iso.datetime(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

export const playlistListSchema = z.object({ playlists: z.array(playlistSchema) });

export const playlistBodySchema = z.object({ playlist: playlistSchema });

export const playlistWithTracksSchema = playlistSchema.extend({
	owner: playlistMemberSchema,
	tracks: z.array(playlistTrackSchema),
	tracksVersion: tracksVersionSchema,
});

export const playlistDetailSchema = z.object({ playlist: playlistWithTracksSchema });

export const addTrackResultSchema = z.object({
	track: playlistTrackSchema,
	tracksVersion: tracksVersionSchema,
	rebalanced: rebalancedSchema,
});

export const removeTrackResultSchema = z.object({ tracksVersion: tracksVersionSchema });

export const moveTrackResultSchema = z.object({
	trackId: z.uuid(),
	rank: z.string().meta({ example: 'l' }),
	tracksVersion: tracksVersionSchema,
	rebalanced: rebalancedSchema,
});

/** Null once the cover is removed: the app falls back to the first track's artwork. */
export const coverResponseSchema = z.object({
	coverUrl: z.url().nullable().meta({
		example: 'https://xyz.supabase.co/storage/v1/object/public/playlist-covers/4f1c…/9a2b….jpg',
	}),
});

export const viewersSchema = z.object({ viewers: z.array(playlistMemberSchema) });
