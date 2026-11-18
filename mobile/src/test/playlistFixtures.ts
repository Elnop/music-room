import type { PlaylistWithTracks } from '@/features/playlists/types';
import type { TrackInPlaylist } from '@/types/track.types';

export const playlistTrack = (id: string, rank: string, trackUri = id): TrackInPlaylist => ({
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
});

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
