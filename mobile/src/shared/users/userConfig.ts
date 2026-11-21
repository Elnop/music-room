import type { MusicGenre, VisibilityLevel } from '@/shared/users/userTypes';

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

export const VISIBILITY_LABELS: Record<VisibilityLevel, string> = {
	public: 'Public',
	friends_only: 'Amis seulement',
	private: 'Privé',
};
