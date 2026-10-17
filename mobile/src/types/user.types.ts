// User Types (aligned with backend)
import type { Ionicons } from '@expo/vector-icons';

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
export type IoniconsName = keyof typeof Ionicons.glyphMap;

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
	pop: { label: 'Pop', icon: '🎵', color: '#FF6B9D' },
	rock: { label: 'Rock', icon: '🎸', color: '#E74C3C' },
	hiphop: { label: 'Hip-Hop', icon: '🎤', color: '#9B59B6' },
	rnb: { label: 'R&B', icon: '💜', color: '#E91E63' },
	jazz: { label: 'Jazz', icon: '🎷', color: '#F39C12' },
	classical: { label: 'Classique', icon: '🎻', color: '#3498DB' },
	electronic: { label: 'Électro', icon: '🎧', color: '#00BCD4' },
	country: { label: 'Country', icon: '🤠', color: '#8D6E63' },
	latin: { label: 'Latino', icon: '💃', color: '#FF5722' },
	metal: { label: 'Metal', icon: '🤘', color: '#607D8B' },
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

export interface User {
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
