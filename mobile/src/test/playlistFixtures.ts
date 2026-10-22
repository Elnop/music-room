import type { PlaylistWithTracks } from '@/features/playlists/types';
import type { TrackInPlaylist } from '@/types/track.types';

/** A track of a playlist, ranked `rank`. */
export const playlistTrack = (id: string, rank: string, trackUri = id): TrackInPlaylist => ({
	id,
	rank,
	title: id,
	artist: 'Artist',
	trackUri,
	durationMs: 1000,
	createdAt: '',
	updatedAt: '',
	addedBy: null,
	addedAt: '',
});

/** A playlist as `GET /api/playlists/:id` returns it. */
export const playlistWithTracks = (
	overrides: Partial<PlaylistWithTracks> = {}
): PlaylistWithTracks => ({
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
});
