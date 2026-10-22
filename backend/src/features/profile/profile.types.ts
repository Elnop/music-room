/**
 * Response and domain types of the profile feature. Request inputs are
 * inferred from the Zod schemas in profile.validators.ts.
 */

import type { z } from 'zod';
import type { Enums, Tables } from '@/shared/types/supabase.generated.js';
import type { musicGenreSchema } from '@/features/profile/profile.validators.js';
import type {
	avatarResponseSchema,
	filteredProfileSchema,
	musicPreferencesSchema,
	ownProfileSchema,
	privacySettingsSchema,
	publicProfileSchema,
} from '@/features/profile/profile-responses.validators.js';

/** Visibility level of a profile field (Supabase enum `visibility_level`). */
export type VisibilityLevel = Enums<'visibility_level'>;

export type MusicGenre = z.infer<typeof musicGenreSchema>;

// Database rows (generated Supabase types)
export type UserProfileRow = Tables<'user_profiles'>;

// Response bodies, inferred from the schemas the OpenAPI document uses.

/** GET and PATCH /api/profile: the caller's own profile. */
export type OwnProfile = z.infer<typeof ownProfileSchema>;

/** A found profile (GET /api/profile/search), without email. */
export type PublicProfile = z.infer<typeof publicProfileSchema>;

/**
 * GET /api/profile/:userId. A field hidden by privacy is undefined, a visible
 * one is present (even if empty).
 */
export type FilteredProfile = z.infer<typeof filteredProfileSchema>;

export type ProfilePrivacy = z.infer<typeof privacySettingsSchema>;

export type MusicPreferences = z.infer<typeof musicPreferencesSchema>;

/** PUT and DELETE /api/profile/avatar: the new avatar URL, null once removed. */
export type AvatarResponse = z.infer<typeof avatarResponseSchema>;
