import { apiRequest } from '@/shared/services/api';
import type {
	AddTrackResult,
	MoveTrackResult,
	RemoveTrackResult,
} from '@/features/playlists/types';
import type { AddQueueItemBody } from '@/shared/types/playback';

/** Adds a track at the end of a playlist; the backend gives it its id and rank. */
export function addTrack(playlistId: string, track: AddQueueItemBody): Promise<AddTrackResult> {
	return apiRequest<AddTrackResult>(`/api/playlists/${playlistId}/tracks`, {
		method: 'POST',
		body: JSON.stringify({
			trackUri: track.trackUri,
			title: track.title,
			artist: track.artist,
			album: track.album,
			albumArt: track.albumArt,
			durationMs: track.durationMs,
		}),
	});
}

export function removeTrack(playlistId: string, trackId: string): Promise<RemoveTrackResult> {
	return apiRequest<RemoveTrackResult>(`/api/playlists/${playlistId}/tracks/${trackId}`, {
		method: 'DELETE',
	});
}

/**
 * Moves a track right after `afterRank` (null = top), checked against the
 * version the client displays. See doc/PLAYLIST_CONCURRENCY.md, "Move".
 */
export function moveTrack(
	playlistId: string,
	trackId: string,
	afterRank: string | null,
	expectedVersion: number
): Promise<MoveTrackResult> {
	return apiRequest<MoveTrackResult>(`/api/playlists/${playlistId}/tracks/${trackId}/move`, {
		method: 'POST',
		body: JSON.stringify({ afterRank, expectedVersion }),
	});
}
