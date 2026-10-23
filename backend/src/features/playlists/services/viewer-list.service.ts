import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { fetchSingle } from '@/shared/utils/database.helpers.js';
import { checkOwnership } from '@/features/playlists/permissions/playlist.permissions.js';
import { OWNER_COLUMNS, toOwner } from '@/features/playlists/utils/playlist.helpers.js';
import type { PlaylistOwner } from '@/features/playlists/playlist.types.js';

export async function getViewers(playlistId: string, userId: string): Promise<PlaylistOwner[]> {
	try {
		await checkOwnership(playlistId, userId);

		const playlist = await fetchSingle<{ viewer_ids: string[] | null }>(
			supabaseAdmin,
			'playlists',
			{ id: playlistId },
			'viewer_ids',
			'Playlist not found',
			'PLAYLIST_NOT_FOUND'
		);

		if ((playlist.viewer_ids ?? []).length === 0) return [];

		const { data: viewers, error: viewersError } = await supabaseAdmin
			.from('user_profiles')
			.select(OWNER_COLUMNS)
			.in('id', playlist.viewer_ids ?? []);

		if (viewersError) throw viewersError;

		return (viewers || []).map(toOwner);
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Failed to get viewers', { error, playlistId });
		throw new AppError(500, 'Failed to get viewers', 'VIEWER_FETCH_ERROR');
	}
}
