import { z } from 'zod';

export const MUSIC_GENRES = [
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
] as const;

export const MAX_GENRES = 5;

export const musicGenreSchema = z.enum(MUSIC_GENRES);

export type MusicGenre = z.infer<typeof musicGenreSchema>;

const GENRES: readonly string[] = MUSIC_GENRES;

function isMusicGenre(genre: string): genre is MusicGenre {
	return GENRES.includes(genre);
}

/** Unknown values of a stored `genres` column are dropped. */
export function parseGenres(genres: string[] | null | undefined): MusicGenre[] {
	if (!genres || !Array.isArray(genres)) return [];
	return genres.filter(isMusicGenre);
}
