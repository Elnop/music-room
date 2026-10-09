import { apiRequest } from '@/services/api';
import type { Playlist, PlaylistWithTracks } from '@/types/playlist.types';
import type { Track } from '@/types/track.types';
import type { PlaylistInput } from '@utils/validators';

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
	async addTrack(playlistId: string, track: Track): Promise<void> {
		if (__DEV__)
			console.log('🎵 [PlaylistApi] Sending add track request', {
				playlistId,
				trackUri: track.trackUri,
				title: track.title,
				albumArt: track.albumArt ? 'present' : 'undefined',
				previewUrl: track.previewUrl ? 'present' : 'undefined',
			});

		await apiRequest(`/api/playlists/${playlistId}/tracks`, {
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

		if (__DEV__) console.log('🟢 [PlaylistApi] Track added successfully');
	},

	/**
	 * Remove track from playlist
	 */
	async removeTrack(playlistId: string, trackId: string): Promise<void> {
		await apiRequest(`/api/playlists/${playlistId}/tracks/${trackId}`, { method: 'DELETE' });
	},

	/**
	 * Reorder tracks in playlist
	 */
	async reorderTracks(playlistId: string, trackIds: string[]): Promise<void> {
		await apiRequest(`/api/playlists/${playlistId}/tracks/reorder`, {
			method: 'PUT',
			body: JSON.stringify({ trackIds }),
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
