import { z } from 'zod';
import { visibilityLevelSchema } from '@/features/profile/profile.validators.js';
import { musicGenreSchema } from '@/shared/music/genres.js';

/** Optional fields are absent when unset or, on another user's profile, hidden by their privacy. */

const profileBase = z.object({
	id: z.uuid(),
	username: z.string(),
	displayName: z.string().optional(),
	avatarUrl: z.url().optional(),
	bio: z.string().optional(),
	favoriteArtist: z.string().optional(),
	createdAt: z.iso.datetime(),
});

export const ownProfileSchema = profileBase.extend({
	email: z.email(),
	updatedAt: z.iso.datetime(),
});

export const publicProfileSchema = profileBase;

/** Only the fields the owner's privacy settings let the caller see. */
export const filteredProfileSchema = profileBase.extend({
	musicPreferences: z.array(musicGenreSchema).optional(),
	email: z.email().nullable().optional(),
	isOwnProfile: z.boolean(),
	isFriend: z.boolean(),
});

const visibility = (field: string) =>
	visibilityLevelSchema.meta({ description: `Who can see your ${field}` });

/** public: everyone, friends_only: mutual follows, private: only the owner. */
export const privacySettingsSchema = z.object({
	userId: z.uuid(),
	emailVisibility: visibility('email'),
	bioVisibility: visibility('bio'),
	avatarVisibility: visibility('avatar'),
	musicPreferencesVisibility: visibility('music preferences'),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

export const musicPreferencesSchema = z.object({
	userId: z.uuid(),
	genres: z.array(musicGenreSchema).meta({ description: 'Favorite genres (max 5)' }),
	updatedAt: z.iso.datetime(),
});

export const genresSchema = z.object({ genres: z.array(musicGenreSchema) });

/** Null once the avatar is removed. */
export const avatarResponseSchema = z.object({
	avatarUrl: z.url().nullable().meta({
		example: 'https://xyz.supabase.co/storage/v1/object/public/avatars/0b5c…/3f2a….jpg',
	}),
});
