import { z } from 'zod';

export const visibilityLevelSchema = z.enum(['public', 'friends_only', 'private']);

export const MUSIC_GENRES = [
	'pop',
	'rock',
	'hiphop',
	'rnb',
	'jazz',
	'classical',
	'electronic',
	'country',
	'latin',
	'metal',
] as const;

export const MAX_GENRES = 5;

export const musicGenreSchema = z.enum(MUSIC_GENRES);

const PROFILE_LIMITS = {
	DISPLAY_NAME_MAX: 15,
	BIO_MAX: 300,
};

export const updateProfileSchema = z.object({
	displayName: z
		.string()
		.max(
			PROFILE_LIMITS.DISPLAY_NAME_MAX,
			`Display name must be ${PROFILE_LIMITS.DISPLAY_NAME_MAX} characters max`
		)
		.optional()
		.refine(val => val === undefined || val.trim().length > 0, {
			message: 'Display name cannot be empty or whitespace only',
		}),
	bio: z
		.string()
		.max(PROFILE_LIMITS.BIO_MAX, `Bio must be ${PROFILE_LIMITS.BIO_MAX} characters max`)
		.optional(),
	avatarUrl: z.url('Avatar URL must be a valid URL').optional(),
});

export const searchUsersSchema = z.object({
	q: z.string().min(1, 'Search query is required').max(100),
	limit: z.coerce.number().min(1).max(50).default(20),
});

export const updatePrivacySchema = z.object({
	emailVisibility: visibilityLevelSchema.optional(),
	bioVisibility: visibilityLevelSchema.optional(),
	avatarVisibility: visibilityLevelSchema.optional(),
	musicPreferencesVisibility: visibilityLevelSchema.optional(),
});

export const updateMusicPreferencesSchema = z.object({
	genres: z
		.array(musicGenreSchema)
		.max(MAX_GENRES, `Maximum ${MAX_GENRES} genres allowed`)
		.refine(genres => new Set(genres).size === genres.length, 'Duplicate genres are not allowed'),
});

/** Size is capped by multer; the type is checked from the bytes, not here. */
export const avatarFileSchema = z.object(
	{
		buffer: z.instanceof(Buffer),
		size: z.number().int().positive('The photo is empty'),
	},
	{ error: 'A photo is required in the multipart field "avatar"' }
);

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePrivacyInput = z.infer<typeof updatePrivacySchema>;
export type UpdateMusicPreferencesInput = z.infer<typeof updateMusicPreferencesSchema>;
