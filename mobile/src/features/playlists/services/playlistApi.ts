import { apiRequest } from '@/shared/services/api';
import type { CoverResponse, Playlist, PlaylistWithTracks } from '@/features/playlists/types';
import type { PlaylistInput } from '@/features/playlists/validators';

// Requests go through `apiRequest`, which adds the token, the client headers the
// backend logs and the runtime backend address, and throws an `ApiError`.

/** The signed-in user's playlists (owned, shared with them). */
export async function fetchPlaylists(): Promise<Playlist[]> {
	const data = await apiRequest<{ playlists: Playlist[] }>('/api/playlists');
	return data.playlists;
}

/** Every public playlist except the user's own. */
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

/** Premium only: a free plan gets 403 PREMIUM_REQUIRED. `uri` is a local JPEG. */
export async function uploadCover(id: string, uri: string): Promise<CoverResponse> {
	const form = new FormData();
	form.append('cover', { uri, name: 'cover.jpg', type: 'image/jpeg' } as unknown as Blob);
	return apiRequest<CoverResponse>(`/api/playlists/${id}/cover`, { method: 'PUT', body: form });
}

/** Allowed on any plan, so a cover kept after a downgrade can still be removed. */
export async function removeCover(id: string): Promise<CoverResponse> {
	return apiRequest<CoverResponse>(`/api/playlists/${id}/cover`, { method: 'DELETE' });
}
