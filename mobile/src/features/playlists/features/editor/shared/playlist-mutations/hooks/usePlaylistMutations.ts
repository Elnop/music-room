import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as playlistEditsApi from '@/features/playlists/features/editor/shared/playlist-mutations/lib/playlistEditsApi';
import type { PlaylistInput } from '@/features/playlists/features/editor/shared/playlist-mutations/types/playlistFormTypes';
import {
	dropFromList,
	patchPlaylist,
	prependPlaylist,
} from '@/features/playlists/features/editor/shared/playlist-mutations/lib/playlistCacheEdits';

export function useCreatePlaylist() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: (input: PlaylistInput) => playlistEditsApi.createPlaylist(input),
		onSuccess: playlist => prependPlaylist(client, playlist),
	});
}

type UpdateVariables = {
	id: string;
	changes: Partial<PlaylistInput>;
};

export function useUpdatePlaylist() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: ({ id, changes }: UpdateVariables) => playlistEditsApi.updatePlaylist(id, changes),
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

export function useDeletePlaylist() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => playlistEditsApi.deletePlaylist(id),
		onSuccess: (_result, id) => dropFromList(client, id),
	});
}
