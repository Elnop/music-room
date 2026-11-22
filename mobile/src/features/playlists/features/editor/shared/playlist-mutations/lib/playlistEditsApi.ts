import { apiRequest } from '@/shared/backend/lib/apiRequest';
import type { Playlist } from '@/features/playlists/shared/playlist/playlistTypes';
import type { PlaylistInput } from '@/features/playlists/features/editor/shared/playlist-mutations/types/playlistFormTypes';

export async function createPlaylist(input: PlaylistInput): Promise<Playlist> {
	const data = await apiRequest<{ playlist: Playlist }>('/api/playlists', {
		method: 'POST',
		body: JSON.stringify(input),
	});
	return data.playlist;
}

export async function updatePlaylist(
	id: string,
	updates: Partial<PlaylistInput>
): Promise<Playlist> {
	const data = await apiRequest<{ playlist: Playlist }>(`/api/playlists/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(updates),
	});
	return data.playlist;
}

export async function deletePlaylist(id: string): Promise<void> {
	await apiRequest(`/api/playlists/${id}`, { method: 'DELETE' });
}
