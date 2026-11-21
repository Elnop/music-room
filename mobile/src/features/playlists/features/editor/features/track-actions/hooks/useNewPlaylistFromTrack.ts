import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/keys';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { showError, showSuccess } from '@/shared/theme/lib/toast';
import { useCreatePlaylist } from '@/features/playlists/features/editor/shared/playlist-mutations/usePlaylistMutations';
import { useAddTrack } from '@/features/playlists/features/editor/shared/track-edits/useTrackEdits';
import { playlistFormSchema } from '@/features/playlists/shared/playlist/lib/validators';
import type { Playlist } from '@/features/playlists/shared/playlist/lib/types';
import type { AddQueueItemBody } from '@/shared/playback/lib/playback';
import { PLAYLIST_NAME_MAX } from '@/features/playlists/features/editor/features/track-actions/playlistName';

export interface NewPlaylistDraft {
	name: string;
	setName: (name: string) => void;
	error?: string;
	creating: boolean;
	start: () => void;
	submit: () => void;
}

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

	async function submit() {
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
			logger.error('[TrackActionsSheetContainer] Create playlist failed:', failure);
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
			logger.error('[TrackActionsSheetContainer] Add to new playlist failed:', failure);
			showError(`Playlist « ${created.name} » créée, mais le titre n'a pas pu y être ajouté`);
		}
		void client.invalidateQueries({ queryKey: queryKeys.playlists.list() });
	}

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
