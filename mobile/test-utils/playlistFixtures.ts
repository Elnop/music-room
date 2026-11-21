import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/playlistTypes';
import type { TrackInPlaylist } from '@/shared/tracks/types/trackTypes';

export function playlistTrack(id: string, rank: string, trackUri = id): TrackInPlaylist {
	return {
		id,
		rank,
		title: id,
		artist: 'Artist',
		trackUri,
		durationMs: 1000,
		unavailable: false,
		createdAt: '',
		updatedAt: '',
		addedBy: null,
		addedAt: '',
	};
}

export function playlistWithTracks(
	overrides: Partial<PlaylistWithTracks> = {}
): PlaylistWithTracks {
	return {
		id: 'p1',
		name: 'Mix',
		ownerId: 'me',
		owner: { id: 'me', username: 'me', email: '' } as PlaylistWithTracks['owner'],
		collaboratorIds: [],
		viewerIds: [],
		visibility: 'public',
		editMode: 'restricted',
		createdAt: '',
		updatedAt: '',
		tracks: [],
		tracksVersion: 1,
		...overrides,
	};
}
