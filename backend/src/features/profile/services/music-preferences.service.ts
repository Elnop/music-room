import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { Tables } from '@/shared/types/supabase.generated.js';
import { MAX_GENRES, MUSIC_GENRES } from '@/features/profile/profile.validators.js';
import type { UpdateMusicPreferencesInput } from '@/features/profile/profile.validators.js';
import type { MusicGenre, MusicPreferences } from '@/features/profile/profile.types.js';
import { parseGenres } from '@/features/profile/utils/music-genres.js';

type MusicPreferencesRow = Tables<'music_preferences'>;

function mapRowToPreferences(row: MusicPreferencesRow): MusicPreferences {
	return {
		userId: row.user_id,
		genres: parseGenres(row.genres),
		updatedAt: row.updated_at ?? new Date().toISOString(),
	};
}

/** Same rules as updateMusicPreferencesSchema, for any caller that skips it. */
function validateGenres(genres: MusicGenre[]): void {
	if (genres.length > MAX_GENRES) {
		throw new AppError(400, `Maximum ${MAX_GENRES} genres allowed`, 'TOO_MANY_GENRES');
	}

	if (new Set(genres).size !== genres.length) {
		throw new AppError(400, 'Duplicate genres not allowed', 'DUPLICATE_GENRES');
	}

	for (const genre of genres) {
		if (!MUSIC_GENRES.includes(genre)) {
			throw new AppError(
				400,
				`Invalid genre: ${genre}. Valid genres are: ${MUSIC_GENRES.join(', ')}`,
				'INVALID_GENRE'
			);
		}
	}
}

/** Creates the user's music preferences row, empty unless genres are given. */
async function createDefaultPreferences(
	userId: string,
	genres: MusicGenre[] = []
): Promise<MusicPreferences> {
	try {
		if (genres.length > 0) validateGenres(genres);

		const { data, error } = await supabaseAdmin
			.from('music_preferences')
			.insert({ user_id: userId, genres })
			.select('*')
			.single();

		if (error) {
			logger.error('Failed to create music preferences', { error });
			throw new AppError(500, 'Failed to create music preferences', 'MUSIC_PREFS_CREATE_ERROR');
		}

		return mapRowToPreferences(data);
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Unexpected error creating music preferences', { error });
		throw new AppError(500, 'Failed to create music preferences', 'MUSIC_PREFS_CREATE_ERROR');
	}
}

/** The user's music preferences, created empty on first read. */
export async function getMusicPreferences(userId: string): Promise<MusicPreferences> {
	try {
		logger.info('Fetching music preferences', { userId });

		const { data, error } = await supabaseAdmin
			.from('music_preferences')
			.select('*')
			.eq('user_id', userId)
			.single();

		if (error) {
			// No row yet: create the default, empty one
			if (error.code === 'PGRST116') return await createDefaultPreferences(userId);
			logger.error('Failed to fetch music preferences', { error });
			throw new AppError(500, 'Failed to fetch music preferences', 'MUSIC_PREFS_FETCH_ERROR');
		}

		return mapRowToPreferences(data);
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Unexpected error fetching music preferences', { error });
		throw new AppError(500, 'Failed to fetch music preferences', 'MUSIC_PREFS_FETCH_ERROR');
	}
}

/** Replaces the user's genres, creating the row when missing. */
export async function updateMusicPreferences(
	userId: string,
	data: UpdateMusicPreferencesInput
): Promise<MusicPreferences> {
	try {
		logger.info('Updating music preferences', { userId, genres: data.genres });

		validateGenres(data.genres);

		const { data: updatedData, error } = await supabaseAdmin
			.from('music_preferences')
			.update({ genres: data.genres, updated_at: new Date().toISOString() })
			.eq('user_id', userId)
			.select('*')
			.single();

		if (error) {
			// No row yet: create it with the given genres
			if (error.code === 'PGRST116') return await createDefaultPreferences(userId, data.genres);
			logger.error('Failed to update music preferences', { error });
			throw new AppError(500, 'Failed to update music preferences', 'MUSIC_PREFS_UPDATE_ERROR');
		}

		logger.info('Music preferences updated successfully', { userId });
		return mapRowToPreferences(updatedData);
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Unexpected error updating music preferences', { error });
		throw new AppError(500, 'Failed to update music preferences', 'MUSIC_PREFS_UPDATE_ERROR');
	}
}

/** Every genre a user can pick. */
export function getAvailableGenres(): MusicGenre[] {
	return [...MUSIC_GENRES];
}
