import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { canViewPlaylist } from '@/features/playlists/permissions/playlist.permissions.js';
import {
	OWNER_COLUMNS,
	formatPlaylistResponse,
	formatTrackResponse,
	toOwner,
} from '@/features/playlists/utils/playlist.helpers.js';
import type { CreatePlaylistInput } from '@/features/playlists/playlist.validators.js';
import type {
	PlaylistResponse,
	PlaylistWithTracksResponse,
} from '@/features/playlists/playlist.types.js';

// Creates a playlist and reads one with its tracks.

/** The playlist with its tracks ordered by rank; 403 when the user cannot view it. */
export async function getPlaylistById(
	playlistId: string,
	userId?: string
): Promise<PlaylistWithTracksResponse> {
	try {
		const { data: playlist, error: playlistError } = await supabaseAdmin
			.from('playlists')
			.select('*')
			.eq('id', playlistId)
			.single();

		if (playlistError || !playlist) {
			throw new AppError(404, 'Playlist not found', 'PLAYLIST_NOT_FOUND');
		}

		if (userId && !canViewPlaylist(playlist, userId)) {
			throw new AppError(403, 'Access denied', 'PLAYLIST_ACCESS_DENIED');
		}

		const { data: playlistTracks, error: tracksError } = await supabaseAdmin
			.from('playlist_tracks')
			.select('rank, added_by, added_at, tracks:track_id (*)')
			.eq('playlist_id', playlistId)
			.order('rank', { ascending: true });

		if (tracksError) throw tracksError;

		const { data: owner, error: ownerError } = await supabaseAdmin
			.from('user_profiles')
			.select(OWNER_COLUMNS)
			.eq('id', playlist.owner_id)
			.single();

		if (ownerError || !owner) {
			throw new AppError(404, 'Playlist owner not found', 'OWNER_NOT_FOUND');
		}

		const formattedTracks = playlistTracks.map(pt => ({
			...formatTrackResponse(pt.tracks),
			rank: pt.rank,
			addedBy: pt.added_by,
			addedAt: pt.added_at ?? new Date().toISOString(),
		}));

		return {
			...formatPlaylistResponse(playlist, formattedTracks.length),
			tracks: formattedTracks,
			owner: toOwner(owner),
			tracksVersion: playlist.tracks_version,
		};
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Failed to get playlist', { error, playlistId });
		throw new AppError(500, 'Failed to fetch playlist', 'PLAYLIST_FETCH_ERROR');
	}
}

/** Defaults: visibility 'public', editMode 'open' (everyone can edit). */
export async function createPlaylist(
	userId: string,
	data: CreatePlaylistInput
): Promise<PlaylistResponse> {
	try {
		const { data: playlist, error } = await supabaseAdmin
			.from('playlists')
			.insert({
				name: data.name,
				description: data.description,
				owner_id: userId,
				visibility: data.visibility ?? 'public',
				edit_mode: data.editMode ?? 'open',
			})
			.select()
			.single();

		if (error) throw error;

		logger.info('Playlist created', {
			playlistId: playlist.id,
			userId,
			visibility: playlist.visibility,
			editMode: playlist.edit_mode,
		});
		return formatPlaylistResponse(playlist, 0);
	} catch (error) {
		logger.error('Failed to create playlist', { error, userId });
		throw new AppError(500, 'Failed to create playlist', 'PLAYLIST_CREATE_ERROR');
	}
}
