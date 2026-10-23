// User Types (aligned with backend)
import type { Ionicons } from '@expo/vector-icons';
import { GENRE_COLORS } from '@/shared/theme/tokens';

// =====================================================
// Visibility Types
// =====================================================

/**
 * Visibility level for profile fields
 */
export type VisibilityLevel = 'public' | 'friends_only' | 'private';

/**
 * Ionicons glyph name type
 */
type IoniconsName = keyof typeof Ionicons.glyphMap;

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
 * Genre display information with emojis and colors
 */
export const GENRE_INFO: Record<MusicGenre, { label: string; icon: string; color: string }> = {
	pop: { label: 'Pop', icon: '🎵', color: GENRE_COLORS.pop },
	rock: { label: 'Rock', icon: '🎸', color: GENRE_COLORS.rock },
	hiphop: { label: 'Hip-Hop', icon: '🎤', color: GENRE_COLORS.hiphop },
	rnb: { label: 'R&B', icon: '💜', color: GENRE_COLORS.rnb },
	jazz: { label: 'Jazz', icon: '🎷', color: GENRE_COLORS.jazz },
	classical: { label: 'Classique', icon: '🎻', color: GENRE_COLORS.classical },
	electronic: { label: 'Électro', icon: '🎧', color: GENRE_COLORS.electronic },
	country: { label: 'Country', icon: '🤠', color: GENRE_COLORS.country },
	latin: { label: 'Latino', icon: '💃', color: GENRE_COLORS.latin },
	metal: { label: 'Metal', icon: '🤘', color: GENRE_COLORS.metal },
};

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
export interface UpdatePrivacyData {
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
export interface UpdateMusicPreferencesData {
	genres: MusicGenre[];
}

// =====================================================
// User Types
// =====================================================

interface User {
	id: string;
	email: string;
	username: string;
	avatarUrl?: string;
	createdAt: string;
}

export interface UserProfile extends User {
	displayName?: string;
	bio?: string;
	favoriteArtist?: string;
	updatedAt: string;
}

export interface UpdateProfileData {
	displayName?: string;
	bio?: string;
	avatarUrl?: string;
	favoriteArtist?: string;
}

/**
 * Answer of PUT and DELETE /api/profile/avatar: the new photo URL, null once removed
 */
export interface AvatarResponse {
	avatarUrl: string | null;
}

/**
 * Profile with privacy-filtered fields
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
	isOwnProfile: boolean;
	isFriend: boolean;
}

/**
 * Visibility label mapping for UI
 */
export const VISIBILITY_LABELS: Record<VisibilityLevel, string> = {
	public: 'Public',
	friends_only: 'Amis seulement',
	private: 'Privé',
};

/**
 * Visibility icons for UI (Ionicons names)
 */
export const VISIBILITY_ICONS: Record<VisibilityLevel, IoniconsName> = {
	public: 'globe-outline',
	friends_only: 'people-outline',
	private: 'lock-closed-outline',
};
