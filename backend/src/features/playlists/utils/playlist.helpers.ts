import type {
	PlaylistDetailsPayload,
	PlaylistRow,
	TrackRow,
	PlaylistResponse,
	PlaylistOwner,
	TrackResponse,
} from '@/features/playlists/playlist.types.js';

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

/** The `playlist:details` payload: the playlist's metadata as stored in `row`. */
export function toDetailsPayload(row: PlaylistRow): PlaylistDetailsPayload {
	return {
		playlistId: row.id,
		name: row.name,
		description: row.description ?? undefined,
		visibility: row.visibility as 'public' | 'private',
		editMode: row.edit_mode as 'open' | 'restricted',
		coverUrl: row.cover_url ?? undefined,
	};
}

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
		unavailable: row.unavailable_at !== null,
		createdAt: row.created_at ?? new Date().toISOString(),
		updatedAt: row.updated_at ?? new Date().toISOString(),
	};
}

/** The user_profiles columns a playlist member (owner, viewer) is built from. */
export const OWNER_COLUMNS = 'id, username, display_name, avatar_url';

interface OwnerProfile {
	id: string;
	username: string;
	display_name: string | null;
	avatar_url: string | null;
}

export function toOwner(profile: OwnerProfile): PlaylistOwner {
	return {
		id: profile.id,
		username: profile.username,
		displayName: profile.display_name ?? undefined,
		avatarUrl: profile.avatar_url ?? undefined,
	};
}
