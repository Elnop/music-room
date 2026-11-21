import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import type {
	Playlist,
	PlaylistWithTracks,
} from '@/features/playlists/shared/playlist/playlistTypes';

type PlaylistPatch = Partial<
	Pick<
		Playlist,
		| 'name'
		| 'description'
		| 'coverUrl'
		| 'visibility'
		| 'editMode'
		| 'collaboratorIds'
		| 'viewerIds'
		| 'updatedAt'
	>
>;

export function patchPlaylist(client: QueryClient, id: string, patch: PlaylistPatch): void {
	client.setQueryData<Playlist[]>(queryKeys.playlists.list(), list =>
		list?.map(playlist => (playlist.id === id ? { ...playlist, ...patch } : playlist))
	);
	client.setQueryData<PlaylistWithTracks>(queryKeys.playlists.detail(id), playlist =>
		playlist ? { ...playlist, ...patch } : playlist
	);
}

export function prependPlaylist(client: QueryClient, playlist: Playlist): void {
	client.setQueryData<Playlist[]>(queryKeys.playlists.list(), list =>
		list ? [playlist, ...list] : list
	);
}

export function dropFromList(client: QueryClient, id: string): void {
	client.setQueryData<Playlist[]>(queryKeys.playlists.list(), list =>
		list?.filter(playlist => playlist.id !== id)
	);
}

export function forgetPlaylist(client: QueryClient, id: string): void {
	client.removeQueries({ queryKey: queryKeys.playlists.detail(id), exact: true });
	client.removeQueries({ queryKey: queryKeys.playlists.members(id), exact: true });
}
