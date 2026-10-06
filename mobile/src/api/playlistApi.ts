import { API_CONFIG } from '@constants';
import type { ApiResponse } from '@/types/api.types';
import type { Playlist, PlaylistWithTracks } from '@/types/playlist.types';
import type { Track } from '@/types/track.types';
import type { PlaylistInput } from '@utils/validators';
import { useAuthStore } from '@/store/authStore';

// Viewer profile type for API responses
export interface ViewerProfile {
	id: string;
	username: string;
	displayName?: string;
	avatarUrl?: string;
}

/**
 * Playlist API Service
 * Handles all playlist-related API calls
 */

const getAuthToken = async (): Promise<string> => {
	const token = useAuthStore.getState().accessToken;
	if (!token) throw new Error('No authentication token available');
	return token;
};

export const playlistApi = {
	/**
	 * Fetch user's playlists
	 */
	async fetchPlaylists(): Promise<Playlist[]> {
		const token = await getAuthToken();
		const response = await fetch(`${API_CONFIG.BASE_URL}/api/playlists`, {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || 'Failed to fetch playlists');
		}

		const data: ApiResponse<{ playlists: Playlist[] }> = await response.json();
		return data.data!.playlists;
	},

	/**
	 * Fetch all public playlists (excluding current user's)
	 */
	async fetchPublicPlaylists(): Promise<Playlist[]> {
		const token = await getAuthToken();
		const response = await fetch(`${API_CONFIG.BASE_URL}/api/playlists/public`, {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || 'Failed to fetch public playlists');
		}

		const data: ApiResponse<{ playlists: Playlist[] }> = await response.json();
		return data.data!.playlists;
	},

	/**
	 * Fetch public playlists of a specific user
	 */
	async fetchUserPublicPlaylists(userId: string): Promise<Playlist[]> {
		const token = await getAuthToken();
		const response = await fetch(`${API_CONFIG.BASE_URL}/api/playlists/user/${userId}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || 'Failed to fetch playlists');
		}

		const data: ApiResponse<{ playlists: Playlist[] }> = await response.json();
		return data.data!.playlists;
	},

	/**
	 * Fetch playlist by ID with tracks
	 */
	async fetchPlaylistById(id: string): Promise<PlaylistWithTracks> {
		const token = await getAuthToken();
		const response = await fetch(`${API_CONFIG.BASE_URL}/api/playlists/${id}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || 'Failed to fetch playlist');
		}

		const data: ApiResponse<{ playlist: PlaylistWithTracks }> = await response.json();
		return data.data!.playlist;
	},

	/**
	 * Create new playlist
	 */
	async createPlaylist(playlistData: PlaylistInput): Promise<Playlist> {
		const token = await getAuthToken();
		const response = await fetch(`${API_CONFIG.BASE_URL}/api/playlists`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(playlistData),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || 'Failed to create playlist');
		}

		const data: ApiResponse<{ playlist: Playlist }> = await response.json();
		return data.data!.playlist;
	},

	/**
	 * Update playlist
	 */
	async updatePlaylist(id: string, updates: Partial<PlaylistInput>): Promise<Playlist> {
		const token = await getAuthToken();
		const response = await fetch(`${API_CONFIG.BASE_URL}/api/playlists/${id}`, {
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(updates),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || 'Failed to update playlist');
		}

		const data: ApiResponse<{ playlist: Playlist }> = await response.json();
		return data.data!.playlist;
	},

	/**
	 * Delete playlist
	 */
	async deletePlaylist(id: string): Promise<void> {
		const token = await getAuthToken();
		const response = await fetch(`${API_CONFIG.BASE_URL}/api/playlists/${id}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || 'Failed to delete playlist');
		}
	},

	/**
	 * Add track to playlist
	 */
	async addTrack(playlistId: string, track: Track): Promise<void> {
		const token = await getAuthToken();

		if (__DEV__)
			console.log('🎵 [PlaylistApi] Sending add track request', {
				playlistId,
				trackUri: track.trackUri,
				title: track.title,
				albumArt: track.albumArt ? 'present' : 'undefined',
				previewUrl: track.previewUrl ? 'present' : 'undefined',
			});

		const response = await fetch(`${API_CONFIG.BASE_URL}/api/playlists/${playlistId}/tracks`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
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

		if (!response.ok) {
			console.error('🔴 [PlaylistApi] Response not OK', {
				status: response.status,
				statusText: response.statusText,
				contentType: response.headers.get('content-type'),
			});

			// Check if response is JSON
			const contentType = response.headers.get('content-type');
			if (contentType && contentType.includes('application/json')) {
				// Parse JSON error response
				let errorData;
				try {
					errorData = await response.json();
					console.error('🔴 [PlaylistApi] JSON error response', errorData);
				} catch (parseError) {
					console.error('🔴 [PlaylistApi] Failed to parse JSON error', parseError);
					throw new Error('Failed to add track (invalid JSON response)');
				}

				// Throw the structured error for parsing in PlaylistSelectorModal
				throw errorData;
			} else {
				// Response is not JSON (likely HTML error page)
				const text = await response.text();
				console.error('🔴 [PlaylistApi] Non-JSON response', {
					responsePreview: text.substring(0, 200),
				});
				throw new Error(`Failed to add track (HTTP ${response.status}): ${response.statusText}`);
			}
		}

		if (__DEV__) console.log('🟢 [PlaylistApi] Track added successfully');
	},

	/**
	 * Remove track from playlist
	 */
	async removeTrack(playlistId: string, trackId: string): Promise<void> {
		const token = await getAuthToken();
		const response = await fetch(
			`${API_CONFIG.BASE_URL}/api/playlists/${playlistId}/tracks/${trackId}`,
			{
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || 'Failed to remove track');
		}
	},

	/**
	 * Reorder tracks in playlist
	 */
	async reorderTracks(playlistId: string, trackIds: string[]): Promise<void> {
		const token = await getAuthToken();
		const response = await fetch(
			`${API_CONFIG.BASE_URL}/api/playlists/${playlistId}/tracks/reorder`,
			{
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ trackIds }),
			}
		);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || 'Failed to reorder tracks');
		}
	},

	/**
	 * Add collaborator to playlist
	 */
	async addCollaborator(playlistId: string, userId: string): Promise<void> {
		const token = await getAuthToken();
		const response = await fetch(
			`${API_CONFIG.BASE_URL}/api/playlists/${playlistId}/collaborators`,
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ userId }),
			}
		);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || 'Failed to add collaborator');
		}
	},

	/**
	 * Remove collaborator from playlist
	 */
	async removeCollaborator(playlistId: string, userId: string): Promise<void> {
		const token = await getAuthToken();
		const response = await fetch(
			`${API_CONFIG.BASE_URL}/api/playlists/${playlistId}/collaborators/${userId}`,
			{
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || 'Failed to remove collaborator');
		}
	},

	/**
	 * Get viewers for a playlist
	 */
	async getViewers(playlistId: string): Promise<ViewerProfile[]> {
		const token = await getAuthToken();
		const response = await fetch(`${API_CONFIG.BASE_URL}/api/playlists/${playlistId}/viewers`, {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || 'Failed to fetch viewers');
		}

		const data: ApiResponse<{ viewers: ViewerProfile[] }> = await response.json();
		return data.data!.viewers;
	},

	/**
	 * Add viewer to playlist (allows viewing private playlist)
	 */
	async addViewer(playlistId: string, userId: string): Promise<void> {
		const token = await getAuthToken();
		const response = await fetch(`${API_CONFIG.BASE_URL}/api/playlists/${playlistId}/viewers`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ userId }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || 'Failed to add viewer');
		}
	},

	/**
	 * Remove viewer from playlist
	 */
	async removeViewer(playlistId: string, userId: string): Promise<void> {
		const token = await getAuthToken();
		const response = await fetch(
			`${API_CONFIG.BASE_URL}/api/playlists/${playlistId}/viewers/${userId}`,
			{
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || 'Failed to remove viewer');
		}
	},
};
