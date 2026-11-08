import type { z } from 'zod';
import type { Tables, TablesUpdate } from '@/shared/types/supabase.generated.js';
import type {
	addTrackResultSchema,
	coverResponseSchema,
	moveTrackResultSchema,
	playlistMemberSchema,
	playlistSchema,
	playlistTrackSchema,
	playlistWithTracksSchema,
	removeTrackResultSchema,
} from '@/features/playlists/playlist-responses.validators.js';

export type PlaylistRow = Tables<'playlists'>;
export type TrackRow = Tables<'tracks'>;
export type PlaylistUpdate = TablesUpdate<'playlists'>;

export type PlaylistOwner = z.infer<typeof playlistMemberSchema>;
export type PlaylistResponse = z.infer<typeof playlistSchema>;
export type TrackInPlaylistResponse = z.infer<typeof playlistTrackSchema>;
export type TrackResponse = Omit<TrackInPlaylistResponse, 'rank' | 'addedBy' | 'addedAt'>;
export type PlaylistWithTracksResponse = z.infer<typeof playlistWithTracksSchema>;
export type AddTrackResult = z.infer<typeof addTrackResultSchema>;
export type RemoveTrackResult = z.infer<typeof removeTrackResultSchema>;
export type MoveTrackResult = z.infer<typeof moveTrackResultSchema>;
export type CoverResponse = z.infer<typeof coverResponseSchema>;

interface PlaylistUpdateBase {
	playlistId: string;
	tracksVersion: number;
	rebalanced: boolean;
}

export type PlaylistUpdatedPayload = PlaylistUpdateBase &
	(
		| { event: 'track_added'; track: TrackInPlaylistResponse }
		| { event: 'track_removed'; trackId: string }
		| { event: 'track_moved'; trackId: string; rank: string }
	);

export interface PlaylistDetailsPayload {
	playlistId: string;
	name: string;
	description?: string;
	visibility: 'public' | 'private';
	editMode: 'open' | 'restricted';
	coverUrl?: string;
}

export interface TracksAvailabilityPayload {
	playlistId: string;
	tracks: { trackId: string; unavailable: boolean }[];
}

export interface PlaylistDeletedPayload {
	playlistId: string;
}
