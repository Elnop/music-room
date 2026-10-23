import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { checkOwnership } from '@/features/playlists/permissions/playlist.permissions.js';
import { formatPlaylistResponse } from '@/features/playlists/utils/playlist.helpers.js';
import * as realtime from '@/realtime/emitters/playlist.emitters.js';
import type { UpdatePlaylistInput } from '@/features/playlists/playlist.validators.js';
import type { PlaylistResponse, PlaylistUpdate } from '@/features/playlists/playlist.types.js';

export async function updatePlaylist(
	playlistId: string,
	userId: string,
	data: UpdatePlaylistInput
): Promise<PlaylistResponse> {
	try {
		await checkOwnership(playlistId, userId);

		const updateData: PlaylistUpdate = {};
		if (data.name !== undefined) updateData.name = data.name;
		if (data.description !== undefined) updateData.description = data.description;
		if (data.visibility !== undefined) updateData.visibility = data.visibility;
		if (data.editMode !== undefined) updateData.edit_mode = data.editMode;

		const { data: playlist, error } = await supabaseAdmin
			.from('playlists')
			.update(updateData)
			.eq('id', playlistId)
			.select()
			.single();

		if (error) throw error;

		const { count } = await supabaseAdmin
			.from('playlist_tracks')
			.select('*', { count: 'exact', head: true })
			.eq('playlist_id', playlistId);
		const response = formatPlaylistResponse(playlist, count || 0);

		realtime.notifyPlaylistDetails({
			playlistId,
			name: response.name,
			description: response.description,
			visibility: response.visibility,
			editMode: response.editMode,
		});

		// Visibility may have changed: evict sockets that lost access (fire-and-forget).
		void realtime.revalidatePlaylistRoom(playlistId);

		logger.info('Playlist updated', { playlistId, userId, updateData });
		return response;
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Failed to update playlist', { error, playlistId });
		throw new AppError(500, 'Failed to update playlist', 'PLAYLIST_UPDATE_ERROR');
	}
}

export async function deletePlaylist(playlistId: string, userId: string): Promise<void> {
	try {
		await checkOwnership(playlistId, userId);

		const { error } = await supabaseAdmin.from('playlists').delete().eq('id', playlistId);

		if (error) throw error;

		// Tell the room first: the revalidation below evicts every socket from it.
		realtime.notifyPlaylistDeleted({ playlistId });

		void realtime.revalidatePlaylistRoom(playlistId);

		logger.info('Playlist deleted', { playlistId, userId });
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Failed to delete playlist', { error, playlistId });
		throw new AppError(500, 'Failed to delete playlist', 'PLAYLIST_DELETE_ERROR');
	}
}
