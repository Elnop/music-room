import type { TrackInPlaylist } from '@/types/track.types';
import type { UserProfile } from '@/types/user.types';

export type EditMode = 'open' | 'restricted';

export interface Playlist {
	id: string;
	name: string;
	description?: string;
	coverUrl?: string;
	firstTrackCover?: string;
	ownerId: string;
	owner?: UserSummary;
	collaboratorIds: string[];
	viewerIds: string[];
	trackCount: number;
	visibility: 'public' | 'private';
	editMode: EditMode;
	createdAt: string;
	updatedAt: string;
}

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

/** Payload of the `playlist:details` socket event. */
export interface PlaylistDetailsEvent {
	playlistId: string;
	name: string;
	description?: string;
	visibility: 'public' | 'private';
	editMode: EditMode;
	/** Absent when the playlist has no custom cover. */
	coverUrl?: string;
}

/** Answer of `PUT`/`DELETE /api/playlists/:id/cover`; null once removed. */
export interface CoverResponse {
	coverUrl: string | null;
}

/** Payload of the `playlist:tracks-availability` socket event: only the tracks that changed. */
export interface TracksAvailabilityEvent {
	playlistId: string;
	tracks: { trackId: string; unavailable: boolean }[];
}

/** Payload of the `playlist:deleted` socket event. */
export interface PlaylistDeletedEvent {
	playlistId: string;
}

/** A user as the playlist screens show them: owner, viewer, friend, search result. */
export interface UserSummary {
	id: string;
	username: string;
	displayName?: string;
	avatarUrl?: string;
}

/** A person given access on « Visibilité et droits »; `canEdit` for a collaborator. */
export interface PlaylistMember extends UserSummary {
	canEdit: boolean;
}

/** A friend and their public playlists, for the carousel of the playlists screen. */
export interface FriendPlaylists {
	friend: UserSummary;
	playlists: Playlist[];
}

/** The playlist routes; the Friends stack reuses PlaylistDetail and SearchTracks. */
export type PlaylistStackParamList = {
	Home: undefined;
	Playlists: undefined;
	PlaylistDetail: { id: string };
	/** With a playlistId, the form edits that playlist. */
	CreatePlaylist: { playlistId?: string } | undefined;
	SearchTracks: { playlistId: string };
	PlaylistSharing: { playlistId: string };
};
