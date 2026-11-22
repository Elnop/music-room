import { apiRequest } from '@/shared/backend/lib/apiRequest';
import type {
	Playlist,
	PlaylistWithTracks,
} from '@/features/playlists/shared/playlist/playlistTypes';

export async function fetchPlaylists(): Promise<Playlist[]> {
	const data = await apiRequest<{ playlists: Playlist[] }>('/api/playlists');
	return data.playlists;
}

export async function fetchPublicPlaylists(): Promise<Playlist[]> {
	const data = await apiRequest<{ playlists: Playlist[] }>('/api/playlists/public');
	return data.playlists;
}

export async function fetchUserPublicPlaylists(userId: string): Promise<Playlist[]> {
	const data = await apiRequest<{ playlists: Playlist[] }>(`/api/playlists/user/${userId}`);
	return data.playlists;
}

export async function fetchPlaylistById(id: string): Promise<PlaylistWithTracks> {
	const data = await apiRequest<{ playlist: PlaylistWithTracks }>(`/api/playlists/${id}`);
	return data.playlist;
}
