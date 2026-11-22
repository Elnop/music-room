import { ApiError } from '@/shared/backend/lib/ApiError';

export function playPlaylistError(error: unknown): string {
	if (error instanceof ApiError) {
		if (error.code === 'PLAYLIST_EMPTY') return 'Aucun titre disponible dans cette playlist';
		if (error.code === 'TRACK_UNAVAILABLE') return "Ce titre n'est plus disponible";
		if (error.code === 'PLAYLIST_ACCESS_DENIED') return "Vous n'avez pas accès à cette playlist";
		if (error.code === 'PLAYLIST_NOT_FOUND') return "Cette playlist n'existe plus";
	}
	return 'Impossible de lire cette playlist';
}
