import { z } from 'zod';

/**
 * Playlist validation schemas using Zod
 */

export const createPlaylistSchema = z.object({
	name: z
		.string()
		.min(1, 'Playlist name is required')
		.max(100, 'Playlist name must be at most 100 characters'),
	description: z.string().max(500, 'Description must be at most 500 characters').optional(),
	visibility: z
		.enum(['public', 'private'], {
			error: 'Visibility must be either public or private',
		})
		.default('public'),
	editMode: z
		.enum(['open', 'restricted'], {
			error: 'Edit mode must be either open or restricted',
		})
		.default('open'),
});

export const updatePlaylistSchema = z.object({
	name: z
		.string()
		.min(1, 'Playlist name cannot be empty')
		.max(100, 'Playlist name must be at most 100 characters')
		.optional(),
	description: z.string().max(500, 'Description must be at most 500 characters').optional(),
	visibility: z.enum(['public', 'private']).optional(),
	editMode: z.enum(['open', 'restricted']).optional(),
});

export const addTrackSchema = z.object({
	trackUri: z.string().min(1).max(500), // Universal track URI (SoundCloud permalink, etc.)
	title: z.string().min(1).max(200),
	artist: z.string().min(1).max(200),
	// Album is optional - SoundCloud and other services may not have album info
	album: z
		.string()
		.max(200)
		.optional()
		.transform(val => (val === '' ? undefined : val)),
	// Accept empty string or valid URL, transform empty string to undefined
	albumArt: z
		.string()
		.optional()
		.transform(val => (val === '' ? undefined : val))
		.pipe(z.url().optional()),
	durationMs: z.number().int().positive(),
	// Accept empty string or valid URL, transform empty string to undefined
	previewUrl: z
		.string()
		.optional()
		.transform(val => (val === '' ? undefined : val))
		.pipe(z.url().optional()),
});

export const reorderTracksSchema = z.object({
	trackIds: z.array(z.uuid()).min(1, 'Track IDs array cannot be empty'),
});

// A rank is a base-62 fraction that never ends with '0' (doc/PLAYLIST_CONCURRENCY.md).
export const rankSchema = z
	.string()
	.max(128)
	.regex(/^[0-9A-Za-z]*[1-9A-Za-z]$/, 'Invalid rank');

export const moveTrackSchema = z.object({
	afterRank: rankSchema.nullable(),
	expectedVersion: z.number().int().nonnegative(),
});

export const addCollaboratorSchema = z.object({
	userId: z.uuid('Invalid user ID format'),
});

export const addViewerSchema = z.object({
	userId: z.uuid('Invalid user ID format'),
});

export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>;
export type UpdatePlaylistInput = z.infer<typeof updatePlaylistSchema>;
export type AddTrackInput = z.infer<typeof addTrackSchema>;
export type ReorderTracksInput = z.infer<typeof reorderTracksSchema>;
export type MoveTrackInput = z.infer<typeof moveTrackSchema>;
export type AddCollaboratorInput = z.infer<typeof addCollaboratorSchema>;
export type AddViewerInput = z.infer<typeof addViewerSchema>;
