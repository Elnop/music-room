import type { PixelIconSource } from '@/shared/components/media/PixelIcon';
import { GENRE_COLORS } from '@/shared/theme/tokens';
import GlobeSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/globe-solid.svg';
import LockSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/lock-solid.svg';
import BoltSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/bolt-solid.svg';
import CrownSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/crown-solid.svg';
import FireSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/fire-solid.svg';
import HeadphonesSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/headphones-solid.svg';
import HeartSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/heart-solid.svg';
import HockeyMaskSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/hockey-mask-solid.svg';
import MoonSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/moon-solid.svg';
import RobotSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/robot-solid.svg';
import SparklesSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/sparkles-solid.svg';
import SunSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/sun-solid.svg';
import UsersSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/users-solid.svg';

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

export const GENRE_INFO: Record<
	MusicGenre,
	{ label: string; color: string; icon: PixelIconSource }
> = {
	pop: { label: 'Pop', color: GENRE_COLORS.pop, icon: SparklesSolid },
	rock: { label: 'Rock', color: GENRE_COLORS.rock, icon: BoltSolid },
	hiphop: { label: 'Hip-Hop', color: GENRE_COLORS.hiphop, icon: HeadphonesSolid },
	rnb: { label: 'R&B', color: GENRE_COLORS.rnb, icon: HeartSolid },
	jazz: { label: 'Jazz', color: GENRE_COLORS.jazz, icon: MoonSolid },
	classical: { label: 'Classique', color: GENRE_COLORS.classical, icon: CrownSolid },
	electronic: { label: 'Électro', color: GENRE_COLORS.electronic, icon: RobotSolid },
	country: { label: 'Country', color: GENRE_COLORS.country, icon: SunSolid },
	latin: { label: 'Latino', color: GENRE_COLORS.latin, icon: FireSolid },
	metal: { label: 'Metal', color: GENRE_COLORS.metal, icon: HockeyMaskSolid },
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

export const VISIBILITY_ICONS: Record<VisibilityLevel, PixelIconSource> = {
	public: GlobeSolid,
	friends_only: UsersSolid,
	private: LockSolid,
};
