import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { showError, showSuccess } from '@/shared/theme/lib/toast';
import type { PlaylistFormInput } from '@/features/playlists/features/editor/shared/playlist-mutations/types/playlistFormTypes';
import type {
	PlaylistCreation,
	PlaylistEdit,
} from '@/features/playlists/features/editor/features/playlist-form/playlistFormTypes';

export async function saveEdits(edit: PlaylistEdit, data: PlaylistFormInput): Promise<void> {
	try {
		await edit.save({
			id: edit.id,
			changes: { name: data.name, description: data.description ?? '' },
		});
		showSuccess('Playlist modifiée');
		edit.navigation.goBack();
	} catch (error) {
		logger.error('[CreatePlaylistScreen] Update playlist failed:', error);
		showError(apiErrorMessage(error, 'Impossible de modifier la playlist'));
	}
}

export async function createAndOpen(
	creation: PlaylistCreation,
	data: PlaylistFormInput,
): Promise<void> {
	try {
		const created = await creation.create({
			...data,
			visibility: creation.settings.isPrivate ? 'private' : 'public',
			editMode: creation.settings.isEditRestricted ? 'restricted' : 'open',
		});
		creation.navigation.replace('PlaylistDetail', { id: created.id });
	} catch (error) {
		logger.error('[CreatePlaylistScreen] Create playlist failed:', error);
		showError(apiErrorMessage(error, 'Impossible de créer la playlist'));
	}
}
