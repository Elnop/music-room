import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { ilikeContains } from '@/shared/utils/postgrest-filter.js';
import { getSearchFieldVisibility } from '@/features/profile/permissions/search-visibility.js';
import type { PublicProfile } from '@/features/profile/profile.types.js';

export class ProfileSearchService {
	/**
	 * Search users by username or display name. Avatar and bio follow each
	 * profile's privacy settings for the viewer, as on GET /:userId (#247).
	 */
	async searchUsers(query: string, limit = 20, viewerId?: string): Promise<PublicProfile[]> {
		try {
			logger.info('Searching users', { query, limit, viewerId });

			// Search by username or display_name using ilike (case-insensitive);
			// the query is matched literally, never read as filter syntax (#236)
			const pattern = ilikeContains(query);
			let queryBuilder = supabaseAdmin
				.from('user_profiles')
				.select('id, username, display_name, avatar_url, bio, favorite_artist, created_at')
				.or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
				.limit(limit);

			// Exclude current user from results
			if (viewerId) {
				queryBuilder = queryBuilder.neq('id', viewerId);
			}

			const { data, error } = await queryBuilder;

			if (error) {
				logger.error('Failed to search users', { error });
				throw new AppError(500, 'Failed to search users', 'SEARCH_ERROR');
			}

			const profiles = data || [];
			const visibility = await getSearchFieldVisibility(
				viewerId,
				profiles.map(profile => profile.id)
			);

			return profiles.map(profile => ({
				id: profile.id,
				username: profile.username,
				displayName: profile.display_name ?? undefined,
				avatarUrl: visibility.get(profile.id)?.avatar
					? (profile.avatar_url ?? undefined)
					: undefined,
				// Visible but empty is '', as on GET /:userId
				bio: visibility.get(profile.id)?.bio ? profile.bio || '' : undefined,
				favoriteArtist: profile.favorite_artist ?? undefined,
				createdAt: profile.created_at ?? new Date().toISOString(),
			}));
		} catch (error) {
			if (error instanceof AppError) throw error;
			logger.error('Unexpected error searching users', { error });
			throw new AppError(500, 'Failed to search users', 'SEARCH_ERROR');
		}
	}
}
