import { MUSIC_GENRES } from '@/features/profile/profile.validators.js';
import type { MusicGenre } from '@/features/profile/profile.types.js';

const GENRES: readonly string[] = MUSIC_GENRES;

function isMusicGenre(genre: string): genre is MusicGenre {
	return GENRES.includes(genre);
}

/** The known genres of a stored `genres` column; anything else is dropped. */
export function parseGenres(genres: string[] | null | undefined): MusicGenre[] {
	if (!genres || !Array.isArray(genres)) return [];
	return genres.filter(isMusicGenre);
}
