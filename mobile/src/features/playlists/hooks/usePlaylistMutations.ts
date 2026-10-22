import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as playlistApi from '@/features/playlists/services/playlistApi';
import type { PlaylistInput } from '@/features/playlists/validators';
import {
	dropFromList,
	patchPlaylist,
	prependPlaylist,
} from '@/features/playlists/utils/playlistCache';

/** Creates a playlist and puts it at the top of the user's list; resolves with it. */
export function useCreatePlaylist() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: (input: PlaylistInput) => playlistApi.createPlaylist(input),
		onSuccess: playlist => prependPlaylist(client, playlist),
	});
}

interface UpdateVariables {
	id: string;
	changes: Partial<PlaylistInput>;
}

/** Updates a playlist's details, visibility or edit mode, in the list and its detail. */
export function useUpdatePlaylist() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: ({ id, changes }: UpdateVariables) => playlistApi.updatePlaylist(id, changes),
		onSuccess: updated =>
			patchPlaylist(client, updated.id, {
				name: updated.name,
				description: updated.description,
				coverUrl: updated.coverUrl,
				visibility: updated.visibility,
				editMode: updated.editMode,
				collaboratorIds: updated.collaboratorIds,
				viewerIds: updated.viewerIds,
				updatedAt: updated.updatedAt,
			}),
	});
}

/** Deletes a playlist and drops it from the user's list. */
export function useDeletePlaylist() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => playlistApi.deletePlaylist(id),
		onSuccess: (_result, id) => dropFromList(client, id),
	});
}
