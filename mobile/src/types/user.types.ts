import type { PixelSpriteName } from '@/shared/constants/pixelSprites';
import { GENRE_COLORS } from '@/shared/theme/tokens';

export type VisibilityLevel = 'public' | 'friends_only' | 'private';


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

export const GENRE_INFO: Record<MusicGenre, { label: string; color: string }> = {
	pop: { label: 'Pop', color: GENRE_COLORS.pop },
	rock: { label: 'Rock', color: GENRE_COLORS.rock },
	hiphop: { label: 'Hip-Hop', color: GENRE_COLORS.hiphop },
	rnb: { label: 'R&B', color: GENRE_COLORS.rnb },
	jazz: { label: 'Jazz', color: GENRE_COLORS.jazz },
	classical: { label: 'Classique', color: GENRE_COLORS.classical },
	electronic: { label: 'Électro', color: GENRE_COLORS.electronic },
	country: { label: 'Country', color: GENRE_COLORS.country },
	latin: { label: 'Latino', color: GENRE_COLORS.latin },
	metal: { label: 'Metal', color: GENRE_COLORS.metal },
};

export const MAX_GENRES = 5;

export interface ProfilePrivacy {
	userId: string;
	emailVisibility: VisibilityLevel;
	bioVisibility: VisibilityLevel;
	avatarVisibility: VisibilityLevel;
	musicPreferencesVisibility: VisibilityLevel;
	createdAt: string;
	updatedAt: string;
}

export interface UpdatePrivacyData {
	emailVisibility?: VisibilityLevel;
	bioVisibility?: VisibilityLevel;
	avatarVisibility?: VisibilityLevel;
	musicPreferencesVisibility?: VisibilityLevel;
}

export interface MusicPreferences {
	userId: string;
	genres: MusicGenre[];
	updatedAt: string;
}

export interface UpdateMusicPreferencesData {
	genres: MusicGenre[];
}

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

/** Answer of PUT and DELETE /api/profile/avatar; null once removed. */
export interface AvatarResponse {
	avatarUrl: string | null;
}

/** Fields hidden by privacy are undefined; visible ones are present, even if empty. */
export interface FilteredProfile {
	id: string;
	username: string;
	displayName?: string;
	avatarUrl?: string;
	bio?: string;
	email?: string | null;
	favoriteArtist?: string;
	musicPreferences?: MusicGenre[];
	createdAt: string;
	isOwnProfile: boolean;
	isFriend: boolean;
}

export const VISIBILITY_LABELS: Record<VisibilityLevel, string> = {
	public: 'Public',
	friends_only: 'Amis seulement',
	private: 'Privé',
};

export const VISIBILITY_ICONS: Record<VisibilityLevel, PixelSpriteName> = {
	public: 'globe',
	friends_only: 'crew',
	private: 'lock',
};
