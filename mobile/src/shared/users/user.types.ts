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

export type ProfilePrivacy = {
	userId: string;
	emailVisibility: VisibilityLevel;
	bioVisibility: VisibilityLevel;
	avatarVisibility: VisibilityLevel;
	musicPreferencesVisibility: VisibilityLevel;
	createdAt: string;
	updatedAt: string;
};

export type UpdatePrivacyData = {
	emailVisibility?: VisibilityLevel;
	bioVisibility?: VisibilityLevel;
	avatarVisibility?: VisibilityLevel;
	musicPreferencesVisibility?: VisibilityLevel;
};

export type MusicPreferences = {
	userId: string;
	genres: MusicGenre[];
	updatedAt: string;
};

export type UpdateMusicPreferencesData = {
	genres: MusicGenre[];
};

type User = {
	id: string;
	email: string;
	username: string;
	avatarUrl?: string;
	createdAt: string;
};

export type UserProfile = User & {
	displayName?: string;
	bio?: string;
	favoriteArtist?: string;
	updatedAt: string;
};

export type UpdateProfileData = {
	displayName?: string;
	bio?: string;
	avatarUrl?: string;
	favoriteArtist?: string;
};

export type AvatarResponse = {
	avatarUrl: string | null;
};

export type FilteredProfile = {
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
};

export const VISIBILITY_LABELS: Record<VisibilityLevel, string> = {
	public: 'Public',
	friends_only: 'Amis seulement',
	private: 'Privé',
};
