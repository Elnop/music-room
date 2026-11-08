import { z } from 'zod';
import { uploadedImageSchema } from '@/shared/storage/image-upload.js';

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

export const rankSchema = z
	.string()
	.max(128)
	.regex(/^[0-9A-Za-z]*[1-9A-Za-z]$/, 'Invalid rank');

export const moveTrackSchema = z.object({
	afterRank: rankSchema.nullable(),
	expectedVersion: z.number().int().nonnegative(),
});

export const trackIdParamSchema = z.object({
	trackId: z.uuid('Invalid track ID format'),
});

export const addCollaboratorSchema = z.object({
	userId: z.uuid('Invalid user ID format'),
});

export const addViewerSchema = z.object({
	userId: z.uuid('Invalid user ID format'),
});

export const coverFileSchema = uploadedImageSchema('cover', 'cover');

export const playlistIdParamSchema = z.object({
	id: z.uuid().meta({ param: { description: 'Playlist ID' } }),
});

export const playlistMemberParamsSchema = playlistIdParamSchema.extend({
	userId: z.uuid().meta({ param: { description: 'ID of the collaborator or viewer' } }),
});

export type CreatePlaylistInput = z.input<typeof createPlaylistSchema>;
export type UpdatePlaylistInput = z.infer<typeof updatePlaylistSchema>;
export type MoveTrackInput = z.infer<typeof moveTrackSchema>;
