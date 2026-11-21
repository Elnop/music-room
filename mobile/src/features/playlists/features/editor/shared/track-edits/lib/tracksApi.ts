import { apiRequest } from '@/shared/backend/lib/api';
import type {
	AddTrackResult,
	MoveTrackResult,
	RemoveTrackResult,
} from '@/features/playlists/shared/playlist/lib/types';
import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';

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
