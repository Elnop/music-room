import { apiRequest } from '@/shared/services/api';
import type { UserSummary } from '@/features/playlists/types';

/** The collaborators (editors) and viewers (invited to a private playlist). */

export async function addCollaborator(playlistId: string, userId: string): Promise<void> {
	await apiRequest(`/api/playlists/${playlistId}/collaborators`, {
		method: 'POST',
		body: JSON.stringify({ userId }),
	});
}

export async function removeCollaborator(playlistId: string, userId: string): Promise<void> {
	await apiRequest(`/api/playlists/${playlistId}/collaborators/${userId}`, { method: 'DELETE' });
}

export async function getViewers(playlistId: string): Promise<UserSummary[]> {
	const data = await apiRequest<{ viewers: UserSummary[] }>(`/api/playlists/${playlistId}/viewers`);
	return data.viewers;
}

export async function addViewer(playlistId: string, userId: string): Promise<void> {
	await apiRequest(`/api/playlists/${playlistId}/viewers`, {
		method: 'POST',
		body: JSON.stringify({ userId }),
	});
}

export async function removeViewer(playlistId: string, userId: string): Promise<void> {
	await apiRequest(`/api/playlists/${playlistId}/viewers/${userId}`, { method: 'DELETE' });
}
