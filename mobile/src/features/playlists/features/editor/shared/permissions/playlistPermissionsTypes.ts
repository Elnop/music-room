import type { Playlist } from '@/features/playlists/shared/playlist/playlistTypes';

export type PlaylistEditFields = Pick<
	Playlist,
	'ownerId' | 'collaboratorIds' | 'viewerIds' | 'visibility' | 'editMode'
>;
