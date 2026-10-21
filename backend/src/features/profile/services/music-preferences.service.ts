import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { Tables } from '@/shared/types/supabase.generated.js';
import type {
	MusicPreferences,
	UpdateMusicPreferencesDTO,
	MusicGenre,
} from '@/features/profile/profile.types.js';
import { MUSIC_GENRES, MAX_GENRES } from '@/features/profile/profile.types.js';

// Use Supabase generated type
type MusicPreferencesRow = Tables<'music_preferences'>;

export class MusicPreferencesService {
	/**
	 * Get music preferences for a user
	 */
	async getMusicPreferences(userId: string): Promise<MusicPreferences> {
		try {
			logger.info('Fetching music preferences', { userId });

			const { data, error } = await supabaseAdmin
				.from('music_preferences')
				.select('*')
				.eq('user_id', userId)
				.single();

			if (error) {
				// If no record exists, create default empty preferences
				if (error.code === 'PGRST116') {
					return await this.createDefaultPreferences(userId);
				}
				logger.error('Failed to fetch music preferences', { error });
				throw new AppError(500, 'Failed to fetch music preferences', 'MUSIC_PREFS_FETCH_ERROR');
			}

			return this.mapRowToPreferences(data);
		} catch (error) {
			if (error instanceof AppError) throw error;
			logger.error('Unexpected error fetching music preferences', { error });
			throw new AppError(500, 'Failed to fetch music preferences', 'MUSIC_PREFS_FETCH_ERROR');
		}
	}

	/**
	 * Update music preferences for a user
	 */
	async updateMusicPreferences(
		userId: string,
		data: UpdateMusicPreferencesDTO
	): Promise<MusicPreferences> {
		try {
			logger.info('Updating music preferences', {
				userId,
				genres: data.genres,
			});

			// Validate genres
			this.validateGenres(data.genres);

			const updateData = {
				genres: data.genres,
				updated_at: new Date().toISOString(),
			};

			const { data: updatedData, error } = await supabaseAdmin
				.from('music_preferences')
				.update(updateData)
				.eq('user_id', userId)
				.select('*')
				.single();

			if (error) {
				// If no record exists, create with provided genres
				if (error.code === 'PGRST116') {
					return await this.createDefaultPreferences(userId, data.genres);
				}
				logger.error('Failed to update music preferences', { error });
				throw new AppError(500, 'Failed to update music preferences', 'MUSIC_PREFS_UPDATE_ERROR');
			}

			logger.info('Music preferences updated successfully', { userId });
			return this.mapRowToPreferences(updatedData);
		} catch (error) {
			if (error instanceof AppError) throw error;
			logger.error('Unexpected error updating music preferences', { error });
			throw new AppError(500, 'Failed to update music preferences', 'MUSIC_PREFS_UPDATE_ERROR');
		}
	}

	/**
	 * Create default music preferences for a user
	 */
	private async createDefaultPreferences(
		userId: string,
		genres: MusicGenre[] = []
	): Promise<MusicPreferences> {
		try {
			// Validate genres if provided
			if (genres.length > 0) {
				this.validateGenres(genres);
			}

			const insertData = {
				user_id: userId,
				genres: genres,
			};

			const { data, error } = await supabaseAdmin
				.from('music_preferences')
				.insert(insertData)
				.select('*')
				.single();

			if (error) {
				logger.error('Failed to create music preferences', { error });
				throw new AppError(500, 'Failed to create music preferences', 'MUSIC_PREFS_CREATE_ERROR');
			}

			return this.mapRowToPreferences(data);
		} catch (error) {
			if (error instanceof AppError) throw error;
			logger.error('Unexpected error creating music preferences', { error });
			throw new AppError(500, 'Failed to create music preferences', 'MUSIC_PREFS_CREATE_ERROR');
		}
	}

	/**
	 * Validate genres array
	 */
	private validateGenres(genres: MusicGenre[]): void {
		// Check max genres
		if (genres.length > MAX_GENRES) {
			throw new AppError(400, `Maximum ${MAX_GENRES} genres allowed`, 'TOO_MANY_GENRES');
		}

		// Check for duplicates
		const uniqueGenres = new Set(genres);
		if (uniqueGenres.size !== genres.length) {
			throw new AppError(400, 'Duplicate genres not allowed', 'DUPLICATE_GENRES');
		}

		// Validate each genre
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

	/**
	 * Get all available genres
	 */
	getAvailableGenres(): MusicGenre[] {
		return [...MUSIC_GENRES];
	}

	/**
	 * Type guard for MusicGenre validation
	 */
	private isValidGenre(genre: string): genre is MusicGenre {
		const validGenres: readonly string[] = [
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
		return validGenres.includes(genre);
	}

	/**
	 * Parse genres from database to typed array
	 */
	private parseGenres(genres: string[] | null): MusicGenre[] {
		if (!genres) return [];
		return genres.filter((g): g is MusicGenre => this.isValidGenre(g));
	}

	/**
	 * Map database row to MusicPreferences
	 */
	private mapRowToPreferences(row: MusicPreferencesRow): MusicPreferences {
		return {
			userId: row.user_id,
			genres: this.parseGenres(row.genres),
			updatedAt: row.updated_at ?? new Date().toISOString(),
		};
	}
}
