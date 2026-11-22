import type { PlaylistFormInput } from '@/features/playlists/features/editor/shared/playlist-mutations/types/playlistFormTypes';
import { useSession } from '@/shared/backend/hooks/useSession';
import { showError } from '@/shared/theme/lib/toast';
import {
	useCreatePlaylist,
	useUpdatePlaylist,
} from '@/features/playlists/features/editor/shared/playlist-mutations/hooks/usePlaylistMutations';
import {
	createAndOpen,
	saveEdits,
} from '@/features/playlists/features/editor/features/playlist-form/playlistSubmit';
import type {
	PlaylistFormNavigation,
	PlaylistSettings,
} from '@/features/playlists/features/editor/features/playlist-form/playlistFormTypes';

export function useSubmitPlaylist(
	navigation: PlaylistFormNavigation,
	editedId: string | undefined,
	settings: Pick<PlaylistSettings, 'isPrivate' | 'isEditRestricted'>,
): (data: PlaylistFormInput) => Promise<void> {
	const signedIn = useSession((session) => session.user !== null);
	const create = useCreatePlaylist();
	const update = useUpdatePlaylist();

	return async (data) => {
		if (editedId !== undefined) {
			await saveEdits({ id: editedId, navigation, save: update.mutateAsync }, data);
			return;
		}
		if (!signedIn) {
			showError('Connexion requise pour créer une playlist');
			return;
		}
		await createAndOpen({ navigation, create: create.mutateAsync, settings }, data);
	};
}
