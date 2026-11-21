import { Share } from 'react-native';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { showError, showSuccess } from '@/shared/theme/lib/toast';
import type { Playlist } from '@/features/playlists/shared/playlist/playlistTypes';
import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';
import type { NewPlaylistContext } from '@/features/playlists/features/editor/features/track-actions/trackActionsTypes';

export async function addToPlaylist(
	addTrack: NewPlaylistContext['addTrack'],
	playlist: Playlist,
	track: AddQueueItemBody
): Promise<void> {
	try {
		await addTrack({ playlistId: playlist.id, track });
		showSuccess(`Ajouté à « ${playlist.name} »`);
	} catch (error) {
		logger.error('[TrackActionsSheetContainer] Add to playlist failed:', error);
		showError(apiErrorMessage(error, "Impossible d'ajouter le titre à la playlist"));
	}
}

export async function shareTrack(track: AddQueueItemBody): Promise<void> {
	try {
		await Share.share({ message: track.trackUri, url: track.trackUri, title: track.title });
	} catch (error) {
		logger.error('[TrackActionsSheetContainer] Share failed:', error);
		showError('Impossible de partager ce titre');
	}
}
