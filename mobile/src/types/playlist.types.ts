import type { TrackWithPosition } from '@/types/track.types';
import type { UserProfile } from '@/types/user.types';

export type EditMode = 'open' | 'restricted';

export interface PlaylistOwner {
	id: string;
	username: string;
	displayName?: string;
	avatarUrl?: string;
}

// Playlist Types (Mock-friendly structure)
export interface Playlist {
	id: string;
	name: string;
	description?: string;
	coverUrl?: string;
	firstTrackCover?: string;
	ownerId: string;
	owner?: PlaylistOwner;
	collaboratorIds: string[];
	viewerIds: string[];
	trackCount: number;
	visibility: 'public' | 'private';
	editMode: EditMode;
	createdAt: string;
	updatedAt: string;
}

// Playlist with full track data and owner info
export interface PlaylistWithTracks extends Omit<Playlist, 'trackCount'> {
	tracks: TrackWithPosition[];
	owner: UserProfile;
}
