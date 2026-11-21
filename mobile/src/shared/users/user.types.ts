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

export interface AvatarResponse {
	avatarUrl: string | null;
}

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
