import { apiRequest } from '@/shared/services/api';
import type {
	AddTrackResult,
	MoveTrackResult,
	Playlist,
	PlaylistWithTracks,
	RemoveTrackResult,
} from '@/types/playlist.types';
import type { Track } from '@/types/track.types';
import type { PlaylistInput } from '@/shared/utils/validators';

// Viewer profile type for API responses
export interface ViewerProfile {
	id: string;
	username: string;
	displayName?: string;
	avatarUrl?: string;
}

/**
 * Playlist API Service
 * Handles all playlist-related API calls. Requests go through `apiRequest`,
 * which adds the token, the client headers and the runtime backend address,
 * and throws an `ApiError` (message and code from the backend) on failure.
 */
export const playlistApi = {
	/**
	 * Fetch user's playlists
	 */
	async fetchPlaylists(): Promise<Playlist[]> {
		const data = await apiRequest<{ playlists: Playlist[] }>('/api/playlists');
		return data.playlists;
	},

	/**
	 * Fetch all public playlists (excluding current user's)
	 */
	async fetchPublicPlaylists(): Promise<Playlist[]> {
		const data = await apiRequest<{ playlists: Playlist[] }>('/api/playlists/public');
		return data.playlists;
	},

	/**
	 * Fetch public playlists of a specific user
	 */
	async fetchUserPublicPlaylists(userId: string): Promise<Playlist[]> {
		const data = await apiRequest<{ playlists: Playlist[] }>(`/api/playlists/user/${userId}`);
		return data.playlists;
	},

	/**
	 * Fetch playlist by ID with tracks
	 */
	async fetchPlaylistById(id: string): Promise<PlaylistWithTracks> {
		const data = await apiRequest<{ playlist: PlaylistWithTracks }>(`/api/playlists/${id}`);
		return data.playlist;
	},

	/**
	 * Create new playlist
	 */
	async createPlaylist(playlistData: PlaylistInput): Promise<Playlist> {
		const data = await apiRequest<{ playlist: Playlist }>('/api/playlists', {
			method: 'POST',
			body: JSON.stringify(playlistData),
		});
		return data.playlist;
	},

	/**
	 * Update playlist
	 */
	async updatePlaylist(id: string, updates: Partial<PlaylistInput>): Promise<Playlist> {
		const data = await apiRequest<{ playlist: Playlist }>(`/api/playlists/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(updates),
		});
		return data.playlist;
	},

	/**
	 * Delete playlist
	 */
	async deletePlaylist(id: string): Promise<void> {
		await apiRequest(`/api/playlists/${id}`, { method: 'DELETE' });
	},

	/**
	 * Add track to playlist
	 */
	async addTrack(playlistId: string, track: Track): Promise<AddTrackResult> {
		const result = await apiRequest<AddTrackResult>(`/api/playlists/${playlistId}/tracks`, {
			method: 'POST',
			body: JSON.stringify({
				trackUri: track.trackUri,
				title: track.title,
				artist: track.artist,
				album: track.album,
				albumArt: track.albumArt,
				durationMs: track.durationMs,
				previewUrl: track.previewUrl,
			}),
		});

		return result;
	},

	/**
	 * Remove track from playlist
	 */
	removeTrack(playlistId: string, trackId: string): Promise<RemoveTrackResult> {
		return apiRequest<RemoveTrackResult>(`/api/playlists/${playlistId}/tracks/${trackId}`, {
			method: 'DELETE',
		});
	},

	/**
	 * Move a track right after `afterRank` (null = top), checked against the
	 * version the client displays. See doc/PLAYLIST_CONCURRENCY.md, "Move".
	 */
	moveTrack(
		playlistId: string,
		trackId: string,
		afterRank: string | null,
		expectedVersion: number
	): Promise<MoveTrackResult> {
		return apiRequest<MoveTrackResult>(`/api/playlists/${playlistId}/tracks/${trackId}/move`, {
			method: 'POST',
			body: JSON.stringify({ afterRank, expectedVersion }),
		});
	},

	/**
	 * Add collaborator to playlist
	 */
	async addCollaborator(playlistId: string, userId: string): Promise<void> {
		await apiRequest(`/api/playlists/${playlistId}/collaborators`, {
			method: 'POST',
			body: JSON.stringify({ userId }),
		});
	},

	/**
	 * Remove collaborator from playlist
	 */
	async removeCollaborator(playlistId: string, userId: string): Promise<void> {
		await apiRequest(`/api/playlists/${playlistId}/collaborators/${userId}`, {
			method: 'DELETE',
		});
	},

	/**
	 * Get viewers for a playlist
	 */
	async getViewers(playlistId: string): Promise<ViewerProfile[]> {
		const data = await apiRequest<{ viewers: ViewerProfile[] }>(
			`/api/playlists/${playlistId}/viewers`
		);
		return data.viewers;
	},

	/**
	 * Add viewer to playlist (allows viewing private playlist)
	 */
	async addViewer(playlistId: string, userId: string): Promise<void> {
		await apiRequest(`/api/playlists/${playlistId}/viewers`, {
			method: 'POST',
			body: JSON.stringify({ userId }),
		});
	},

	/**
	 * Remove viewer from playlist
	 */
	async removeViewer(playlistId: string, userId: string): Promise<void> {
		await apiRequest(`/api/playlists/${playlistId}/viewers/${userId}`, { method: 'DELETE' });
	},
};
