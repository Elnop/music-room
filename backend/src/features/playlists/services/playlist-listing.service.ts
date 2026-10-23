import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { OWNER_COLUMNS, toOwner } from '@/features/playlists/utils/playlist.helpers.js';
import { toSummaries } from '@/features/playlists/utils/playlist-summaries.js';
import {
	fetchTrackStats,
	summarizeWithOwners,
} from '@/features/playlists/services/playlist-summaries.service.js';
import type { PlaylistResponse } from '@/features/playlists/playlist.types.js';

export async function getUserPlaylists(userId: string): Promise<PlaylistResponse[]> {
	try {
		const { data: playlists, error } = await supabaseAdmin
			.from('playlists')
			.select('*')
			.or(`owner_id.eq.${userId},collaborator_ids.cs.{${userId}},viewer_ids.cs.{${userId}}`)
			.order('created_at', { ascending: false });

		if (error) throw error;
		return await summarizeWithOwners(playlists ?? []);
	} catch (error) {
		logger.error('Failed to get user playlists', { error, userId });
		throw new AppError(500, 'Failed to fetch playlists', 'PLAYLIST_FETCH_ERROR');
	}
}

/** Public playlists of a user, plus the private ones the current user is invited to. */
export async function getPlaylistsByUser(
	targetUserId: string,
	currentUserId?: string
): Promise<PlaylistResponse[]> {
	try {
		let query = supabaseAdmin.from('playlists').select('*').eq('owner_id', targetUserId);

		if (currentUserId) {
			query = query.or(
				`visibility.eq.public,and(visibility.eq.private,or(viewer_ids.cs.{${currentUserId}},collaborator_ids.cs.{${currentUserId}}))`
			);
		} else {
			query = query.eq('visibility', 'public');
		}

		const { data: playlists, error } = await query.order('created_at', { ascending: false });

		if (error) throw error;
		if (!playlists || playlists.length === 0) return [];

		const stats = await fetchTrackStats(playlists.map(p => p.id));

		const { data: owner, error: ownerError } = await supabaseAdmin
			.from('user_profiles')
			.select(OWNER_COLUMNS)
			.eq('id', targetUserId)
			.single();

		if (ownerError) throw ownerError;

		const ownerInfo = owner ? toOwner(owner) : undefined;
		return toSummaries(playlists, stats, () => ownerInfo);
	} catch (error) {
		logger.error('Failed to get user playlists', { error, targetUserId });
		throw new AppError(500, 'Failed to fetch playlists', 'PLAYLIST_FETCH_ERROR');
	}
}

export async function getPublicPlaylists(currentUserId: string): Promise<PlaylistResponse[]> {
	try {
		const { data: playlists, error } = await supabaseAdmin
			.from('playlists')
			.select('*')
			.eq('visibility', 'public')
			.neq('owner_id', currentUserId)
			.order('created_at', { ascending: false })
			.limit(50);

		if (error) throw error;
		return await summarizeWithOwners(playlists ?? []);
	} catch (error) {
		logger.error('Failed to get public playlists', { error, currentUserId });
		throw new AppError(500, 'Failed to fetch public playlists', 'PLAYLIST_FETCH_ERROR');
	}
}
