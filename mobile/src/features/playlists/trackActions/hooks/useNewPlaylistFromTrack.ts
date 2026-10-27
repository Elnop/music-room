import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { logger } from '@/shared/utils/logger';
import { showError, showSuccess } from '@/shared/utils/toast';
import { useCreatePlaylist } from '@/features/playlists/hooks/usePlaylistMutations';
import { useAddTrack } from '@/features/playlists/hooks/useTrackEdits';
import { playlistFormSchema } from '@/features/playlists/validators';
import type { Playlist } from '@/features/playlists/types';
import type { AddQueueItemBody } from '@/shared/types/playback';

export const PLAYLIST_NAME_MAX = 50;

export interface NewPlaylistDraft {
	name: string;
	setName: (name: string) => void;
	error?: string;
	creating: boolean;
	/** Prefills the name with the track's title. */
	start: () => void;
	submit: () => void;
}

/**
 * Default settings (public, open), as the full form. The sheet closes once the playlist
 * exists: a creation error shows in it, an add error in a toast that says it was created.
 */
export function useNewPlaylistFromTrack(
	track: AddQueueItemBody | null,
	onClose: () => void
): NewPlaylistDraft {
	const client = useQueryClient();
	const [name, setName] = useState('');
	const [error, setError] = useState<string>();
	const [creating, setCreating] = useState(false);
	const create = useCreatePlaylist();
	const addTrack = useAddTrack();

	const submit = async () => {
		if (!track || creating) return;
		const parsed = playlistFormSchema.shape.name.safeParse(name.trim());
		if (!parsed.success) {
			setError(parsed.error.issues[0]?.message);
			return;
		}
		setCreating(true);
		let created: Playlist;
		try {
			created = await create.mutateAsync({ name: parsed.data });
		} catch (failure) {
			logger.error('[TrackActionsSheet] Create playlist failed:', failure);
			setError(apiErrorMessage(failure, 'Impossible de créer la playlist'));
			setCreating(false);
			return;
		}
		setCreating(false);
		onClose();
		try {
			await addTrack.mutateAsync({ playlistId: created.id, track });
			showSuccess(`Ajouté à « ${created.name} »`);
		} catch (failure) {
			logger.error('[TrackActionsSheet] Add to new playlist failed:', failure);
			showError(`Playlist « ${created.name} » créée, mais le titre n'a pas pu y être ajouté`);
		}
		// The list holds the playlist since its creation, with no track yet.
		void client.invalidateQueries({ queryKey: queryKeys.playlists.list() });
	};

	return {
		name,
		setName: value => {
			setName(value);
			setError(undefined);
		},
		error,
		creating,
		start: () => {
			setName((track?.title ?? '').slice(0, PLAYLIST_NAME_MAX));
			setError(undefined);
		},
		submit: () => void submit(),
	};
}
