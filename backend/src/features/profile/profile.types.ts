/**
 * Profile Feature Types
 */

import type { Enums } from '@/shared/types/supabase.generated.js';

// =====================================================
// Visibility Types
// =====================================================

/**
 * Visibility level for profile fields
 * Aligned with Supabase enum: visibility_level
 */
export type VisibilityLevel = Enums<'visibility_level'>;

/**
 * Music genre options (10 total, user can select max 5)
 */
export type MusicGenre =
	| 'pop'
	| 'rock'
	| 'hiphop'
	| 'rnb'
	| 'jazz'
	| 'classical'
	| 'electronic'
	| 'country'
	| 'latin'
	| 'metal';

/**
 * All available music genres
 */
export const MUSIC_GENRES: MusicGenre[] = [
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
];

/**
 * Maximum number of genres a user can select
 */
export const MAX_GENRES = 5;

// =====================================================
// Privacy Types
// =====================================================

/**
 * Profile privacy settings
 */
export interface ProfilePrivacy {
	userId: string;
	emailVisibility: VisibilityLevel;
	bioVisibility: VisibilityLevel;
	avatarVisibility: VisibilityLevel;
	musicPreferencesVisibility: VisibilityLevel;
	createdAt: string;
	updatedAt: string;
}

/**
 * DTO for updating privacy settings
 */
export interface UpdatePrivacyDTO {
	emailVisibility?: VisibilityLevel;
	bioVisibility?: VisibilityLevel;
	avatarVisibility?: VisibilityLevel;
	musicPreferencesVisibility?: VisibilityLevel;
}

// =====================================================
// Music Preferences Types
// =====================================================

/**
 * User's music preferences
 */
export interface MusicPreferences {
	userId: string;
	genres: MusicGenre[];
	updatedAt: string;
}

/**
 * DTO for updating music preferences
 */
export interface UpdateMusicPreferencesDTO {
	genres: MusicGenre[];
}

// =====================================================
// Profile Types
// =====================================================

/**
 * DTO for updating user profile
 */
export interface UpdateProfileDTO {
	displayName?: string;
	bio?: string;
	avatarUrl?: string;
	favoriteArtist?: string;
}

/**
 * Profile update response
 */
export interface ProfileUpdateResponse {
	id: string;
	email: string;
	username: string;
	displayName?: string;
	avatarUrl?: string;
	bio?: string;
	favoriteArtist?: string;
	createdAt: string;
	updatedAt: string;
}

/**
 * Public profile (for search results, no email)
 */
export interface PublicProfile {
	id: string;
	username: string;
	displayName?: string;
	avatarUrl?: string;
	bio?: string;
	favoriteArtist?: string;
	musicPreferences?: MusicGenre[];
	createdAt: string;
}

/**
 * Extended profile with privacy-filtered fields
 * Fields are undefined if hidden by privacy, present (even if empty) if visible
 */
export interface FilteredProfile {
	id: string;
	username: string;
	displayName?: string;
	avatarUrl?: string; // undefined if hidden by privacy
	bio?: string; // undefined if hidden by privacy
	email?: string | null; // undefined if hidden by privacy
	favoriteArtist?: string;
	musicPreferences?: MusicGenre[]; // undefined if hidden by privacy
	createdAt: string;
	// Viewer context
	isOwnProfile: boolean;
	isFriend: boolean;
}

// Database row types: Use Tables<'table_name'> from @/shared/types/supabase.generated.js
// Example: type ProfilePrivacyRow = Tables<'profile_privacy'>
