/**
 * Response and domain types of the playlists feature. Request inputs are
 * inferred from the Zod schemas in playlist.validators.ts.
 */

import type { z } from 'zod';
import type { Tables, TablesUpdate } from '@/shared/types/supabase.generated.js';
import type {
	addTrackResultSchema,
	moveTrackResultSchema,
	playlistMemberSchema,
	playlistSchema,
	playlistTrackSchema,
	playlistWithTracksSchema,
	removeTrackResultSchema,
} from '@/features/playlists/playlist-responses.validators.js';

// Database rows (generated Supabase types)
export type PlaylistRow = Tables<'playlists'>;
export type TrackRow = Tables<'tracks'>;
export type PlaylistUpdate = TablesUpdate<'playlists'>;

// Response bodies, inferred from the schemas the OpenAPI document uses.
export type PlaylistOwner = z.infer<typeof playlistMemberSchema>;
export type PlaylistResponse = z.infer<typeof playlistSchema>;
export type TrackInPlaylistResponse = z.infer<typeof playlistTrackSchema>;
export type TrackResponse = Omit<TrackInPlaylistResponse, 'rank' | 'addedBy' | 'addedAt'>;
export type PlaylistWithTracksResponse = z.infer<typeof playlistWithTracksSchema>;
export type AddTrackResult = z.infer<typeof addTrackResultSchema>;
export type RemoveTrackResult = z.infer<typeof removeTrackResultSchema>;
export type MoveTrackResult = z.infer<typeof moveTrackResultSchema>;

interface PlaylistUpdateBase {
	playlistId: string;
	tracksVersion: number;
	/** Every rank of the playlist changed: clients reload it. */
	rebalanced: boolean;
}

/** Payload of the `playlist:updated` socket event: one delta per operation. */
export type PlaylistUpdatedPayload = PlaylistUpdateBase &
	(
		| { event: 'track_added'; track: TrackInPlaylistResponse }
		| { event: 'track_removed'; trackId: string }
		| { event: 'track_moved'; trackId: string; rank: string }
	);

/** Payload of the `playlist:details` socket event: the playlist's metadata after a PATCH. */
export interface PlaylistDetailsPayload {
	playlistId: string;
	name: string;
	description?: string;
	visibility: 'public' | 'private';
	editMode: 'open' | 'restricted';
}

/** Payload of the `playlist:deleted` socket event, sent before the room is emptied. */
export interface PlaylistDeletedPayload {
	playlistId: string;
}
