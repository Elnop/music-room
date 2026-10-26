import type { z } from 'zod';
import type { Enums, Tables } from '@/shared/types/supabase.generated.js';
import type {
	avatarResponseSchema,
	filteredProfileSchema,
	musicPreferencesSchema,
	ownProfileSchema,
	privacySettingsSchema,
	publicProfileSchema,
} from '@/features/profile/profile-responses.validators.js';

export type VisibilityLevel = Enums<'visibility_level'>;

export type UserProfileRow = Tables<'user_profiles'>;

export type OwnProfile = z.infer<typeof ownProfileSchema>;

export type PublicProfile = z.infer<typeof publicProfileSchema>;

/** A field hidden by privacy is undefined; a visible one is present, even if empty. */
export type FilteredProfile = z.infer<typeof filteredProfileSchema>;

export type ProfilePrivacy = z.infer<typeof privacySettingsSchema>;

export type MusicPreferences = z.infer<typeof musicPreferencesSchema>;

export type AvatarResponse = z.infer<typeof avatarResponseSchema>;
