import { apiRequest } from '@/shared/backend/lib/apiRequest';
import { jpegFormData } from '@/shared/backend/lib/jpegFormData';
import type { CoverResponse } from '@/features/playlists/shared/playlist/playlistTypes';

export async function uploadCover(id: string, uri: string): Promise<CoverResponse> {
	const form = await jpegFormData('cover', uri, 'cover.jpg');
	return apiRequest<CoverResponse>(`/api/playlists/${id}/cover`, { method: 'PUT', body: form });
}

export async function removeCover(id: string): Promise<CoverResponse> {
	return apiRequest<CoverResponse>(`/api/playlists/${id}/cover`, { method: 'DELETE' });
}
