import { apiRequest } from '@/shared/backend/lib/apiRequest';
import type { PlaylistChoice } from '@/features/events/eventTypes';

type OwnPlaylist = {
	id: string;
	name: string;
	ownerId: string;
	visibility: 'public' | 'private';
};

export async function fetchPlaylistChoices(userId: string): Promise<PlaylistChoice[]> {
	const data = await apiRequest<{ playlists: OwnPlaylist[] }>('/api/playlists');
	return data.playlists
		.filter(playlist => playlist.ownerId === userId && playlist.visibility === 'public')
		.map(({ id, name }) => ({ id, name }));
}
