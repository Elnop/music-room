import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { showError, showSuccess } from '@/shared/theme/lib/toast';
import { playlistFormSchema } from '@/features/playlists/features/editor/shared/playlist-mutations/playlistSchemas';
import type { Playlist } from '@/features/playlists/shared/playlist/playlistTypes';
import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';
import type { NewPlaylistContext } from '@/features/playlists/features/editor/features/track-actions/trackActionsTypes';

async function createPlaylist(context: NewPlaylistContext, name: string): Promise<Playlist | null> {
	try {
		return await context.create({ name });
	} catch (failure) {
		logger.error('[TrackActionsSheetContainer] Create playlist failed:', failure);
		context.draft.setError(apiErrorMessage(failure, 'Impossible de créer la playlist'));
		return null;
	}
}

async function addToNewPlaylist(
	context: NewPlaylistContext,
	created: Playlist,
	track: AddQueueItemBody
): Promise<void> {
	try {
		await context.addTrack({ playlistId: created.id, track });
		showSuccess(`Ajouté à « ${created.name} »`);
	} catch (failure) {
		logger.error('[TrackActionsSheetContainer] Add to new playlist failed:', failure);
		showError(`Playlist « ${created.name} » créée, mais le titre n'a pas pu y être ajouté`);
	}
}

export async function submitNewPlaylist(
	context: NewPlaylistContext,
	track: AddQueueItemBody
): Promise<void> {
	const parsed = playlistFormSchema.shape.name.safeParse(context.draft.name.trim());
	if (!parsed.success) {
		context.draft.setError(parsed.error.issues[0]?.message);
		return;
	}
	context.draft.setCreating(true);
	const created = await createPlaylist(context, parsed.data);
	context.draft.setCreating(false);
	if (!created) return;
	context.onClose();
	await addToNewPlaylist(context, created, track);
	context.refreshList();
}
