import type {
	PlaylistRow,
	TrackRow,
	PlaylistResponse,
	PlaylistOwner,
	TrackResponse,
} from '@/features/playlists/playlist.types.js';

/**
 * Format playlist row to response object
 */
export function formatPlaylistResponse(
	row: PlaylistRow,
	trackCount: number,
	owner?: PlaylistOwner,
	firstTrackCover?: string
): PlaylistResponse {
	return {
		id: row.id,
		name: row.name,
		description: row.description ?? undefined,
		coverUrl: row.cover_url ?? undefined,
		firstTrackCover,
		ownerId: row.owner_id,
		owner,
		collaboratorIds: row.collaborator_ids ?? [],
		viewerIds: row.viewer_ids ?? [],
		visibility: row.visibility as 'public' | 'private',
		editMode: row.edit_mode as 'open' | 'restricted',
		trackCount,
		createdAt: row.created_at ?? new Date().toISOString(),
		updatedAt: row.updated_at ?? new Date().toISOString(),
	};
}

/**
 * Format track row to response object
 */
export function formatTrackResponse(row: TrackRow): TrackResponse {
	return {
		id: row.id,
		trackUri: row.track_uri,
		title: row.title,
		artist: row.artist,
		album: row.album ?? undefined,
		albumArt: row.album_art ?? undefined,
		durationMs: row.duration_ms,
		previewUrl: row.preview_url ?? undefined,
		createdAt: row.created_at ?? new Date().toISOString(),
		updatedAt: row.updated_at ?? new Date().toISOString(),
	};
}
