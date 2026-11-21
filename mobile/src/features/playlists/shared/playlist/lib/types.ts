import type { TrackInPlaylist } from '@/shared/tracks/types/trackTypes';
import type { UserProfile } from '@/shared/users/userTypes';

export type EditMode = 'open' | 'restricted';

export type Playlist = {
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
};

export type PlaylistWithTracks = Omit<Playlist, 'trackCount'> & {
	tracks: TrackInPlaylist[];
	owner: UserProfile;
	tracksVersion: number;
};

export type AddTrackResult = {
	track: TrackInPlaylist;
	tracksVersion: number;
	rebalanced: boolean;
};

export type RemoveTrackResult = {
	tracksVersion: number;
};

export type MoveTrackResult = {
	trackId: string;
	rank: string;
	tracksVersion: number;
	rebalanced: boolean;
};

type PlaylistUpdateBase = {
	playlistId: string;
	tracksVersion: number;
	rebalanced: boolean;
};

export type PlaylistUpdatedEvent = PlaylistUpdateBase &
	(
		| { event: 'track_added'; track: TrackInPlaylist }
		| { event: 'track_removed'; trackId: string }
		| { event: 'track_moved'; trackId: string; rank: string }
	);

export type PlaylistDetailsEvent = {
	playlistId: string;
	name: string;
	description?: string;
	visibility: 'public' | 'private';
	editMode: EditMode;
	coverUrl?: string;
};

export type CoverResponse = {
	coverUrl: string | null;
};

export type TracksAvailabilityEvent = {
	playlistId: string;
	tracks: { trackId: string; unavailable: boolean }[];
};

export type PlaylistDeletedEvent = {
	playlistId: string;
};

export type UserSummary = {
	id: string;
	username: string;
	displayName?: string;
	avatarUrl?: string;
};

export type PlaylistMember = UserSummary & {
	canEdit: boolean;
};

export type FriendPlaylists = {
	friend: UserSummary;
	playlists: Playlist[];
};

export type PlaylistStackParamList = {
	Home: undefined;
	Playlists: undefined;
	PlaylistDetail: { id: string };
	CreatePlaylist: { playlistId?: string } | undefined;
	SearchTracks: { playlistId: string };
	PlaylistSharing: { playlistId: string };
};
