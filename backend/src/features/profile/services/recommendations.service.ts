import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { parseGenres } from '@/shared/music/genres.js';
import { getSearchFieldVisibility } from '@/features/profile/permissions/search-visibility.js';
import type {
	ProfileRecommendations,
	RecommendedProfile,
} from '@/features/profile/profile.types.js';

function failure(context: string, error: unknown): AppError {
	logger.error(context, { error });
	return new AppError(500, 'Failed to load recommendations', 'RECOMMENDATIONS_ERROR');
}

/** Ranking and privacy filtering happen in recommend_similar_profiles (migration 033). */
export async function getRecommendations(
	userId: string,
	limit: number
): Promise<ProfileRecommendations> {
	const { data: preferences, error: preferencesError } = await supabaseAdmin
		.from('music_preferences')
		.select('genres')
		.eq('user_id', userId)
		.maybeSingle();
	if (preferencesError) throw failure('Failed to read music preferences', preferencesError);
	if (parseGenres(preferences?.genres).length === 0) {
		return { hasPreferences: false, profiles: [] };
	}

	const { data: ranked, error: rankError } = await supabaseAdmin.rpc('recommend_similar_profiles', {
		p_user: userId,
		p_limit: limit,
	});
	if (rankError) throw failure('Failed to rank similar profiles', rankError);
	if (ranked.length === 0) return { hasPreferences: true, profiles: [] };

	const ids = ranked.map(row => row.user_id);
	const [{ data: rows, error: profilesError }, visibility] = await Promise.all([
		supabaseAdmin
			.from('user_profiles')
			.select('id, username, display_name, avatar_url')
			.in('id', ids),
		getSearchFieldVisibility(userId, ids),
	]);
	if (profilesError) throw failure('Failed to read recommended profiles', profilesError);

	const byId = new Map(rows.map(row => [row.id, row]));
	const profiles: RecommendedProfile[] = [];
	for (const { user_id: id, common_genres: commonGenres, score } of ranked) {
		const row = byId.get(id);
		const genres = parseGenres(commonGenres);
		if (!row || genres.length === 0) continue;
		profiles.push({
			id,
			username: row.username,
			displayName: row.display_name ?? undefined,
			avatarUrl: visibility.get(id)?.avatar ? (row.avatar_url ?? undefined) : undefined,
			commonGenres: genres,
			score,
		});
	}
	return { hasPreferences: true, profiles };
}
