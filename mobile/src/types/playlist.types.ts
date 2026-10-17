import type { TrackInPlaylist } from '@/types/track.types';
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
	/** Ordered by rank. */
	tracks: TrackInPlaylist[];
	owner: UserProfile;
	/** Incremented by every add, remove and move; sent back as expectedVersion. */
	tracksVersion: number;
}

export interface AddTrackResult {
	track: TrackInPlaylist;
	tracksVersion: number;
	rebalanced: boolean;
}

export interface RemoveTrackResult {
	tracksVersion: number;
}

export interface MoveTrackResult {
	trackId: string;
	rank: string;
	tracksVersion: number;
	rebalanced: boolean;
}

interface PlaylistUpdateBase {
	playlistId: string;
	tracksVersion: number;
	/** Every rank of the playlist changed: reload the playlist. */
	rebalanced: boolean;
}

/** Payload of the `playlist:updated` socket event: one delta per operation. */
export type PlaylistUpdatedEvent = PlaylistUpdateBase &
	(
		| { event: 'track_added'; track: TrackInPlaylist }
		| { event: 'track_removed'; trackId: string }
		| { event: 'track_moved'; trackId: string; rank: string }
	);

/** Payload of the `playlist:details` socket event: the playlist's metadata after an update. */
export interface PlaylistDetailsEvent {
	playlistId: string;
	name: string;
	description?: string;
	visibility: 'public' | 'private';
	editMode: EditMode;
}

/** Payload of the `playlist:deleted` socket event. */
export interface PlaylistDeletedEvent {
	playlistId: string;
}
