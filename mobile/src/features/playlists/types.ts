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
	tracks: TrackInPlaylist[];
	owner: UserProfile;
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
	rebalanced: boolean;
}

export type PlaylistUpdatedEvent = PlaylistUpdateBase &
	(
		| { event: 'track_added'; track: TrackInPlaylist }
		| { event: 'track_removed'; trackId: string }
		| { event: 'track_moved'; trackId: string; rank: string }
	);

export interface PlaylistDetailsEvent {
	playlistId: string;
	name: string;
	description?: string;
	visibility: 'public' | 'private';
	editMode: EditMode;
	coverUrl?: string;
}

export interface CoverResponse {
	coverUrl: string | null;
}

export interface TracksAvailabilityEvent {
	playlistId: string;
	tracks: { trackId: string; unavailable: boolean }[];
}

export interface PlaylistDeletedEvent {
	playlistId: string;
}

export interface UserSummary {
	id: string;
	username: string;
	displayName?: string;
	avatarUrl?: string;
}

export interface PlaylistMember extends UserSummary {
	canEdit: boolean;
}

export interface FriendPlaylists {
	friend: UserSummary;
	playlists: Playlist[];
}

export type PlaylistStackParamList = {
	Home: undefined;
	Playlists: undefined;
	PlaylistDetail: { id: string };
	CreatePlaylist: { playlistId?: string } | undefined;
	SearchTracks: { playlistId: string };
	PlaylistSharing: { playlistId: string };
};
