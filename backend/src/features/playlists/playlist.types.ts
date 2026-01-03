/**
 * Playlist DTOs and Types
 */

import type { Tables, TablesInsert, TablesUpdate } from '@/shared/types/supabase.generated.js';

export type EditMode = 'open' | 'restricted';

// Database types (now using Supabase generated types)
export type PlaylistRow = Tables<'playlists'>;
export type TrackRow = Tables<'tracks'>;
export type PlaylistTrackRow = Tables<'playlist_tracks'>;

// Insert types for creating new records
export type PlaylistInsert = TablesInsert<'playlists'>;
export type TrackInsert = TablesInsert<'tracks'>;
export type PlaylistTrackInsert = TablesInsert<'playlist_tracks'>;

// Update types for updating records
export type PlaylistUpdate = TablesUpdate<'playlists'>;
export type TrackUpdate = TablesUpdate<'tracks'>;
export type PlaylistTrackUpdate = TablesUpdate<'playlist_tracks'>;

// DTOs for API requests
export interface CreatePlaylistDTO {
	name: string;
	description?: string;
	visibility?: 'public' | 'private';
	editMode?: EditMode;
}

export interface UpdatePlaylistDTO {
	name?: string;
	description?: string;
	visibility?: 'public' | 'private';
	editMode?: EditMode;
}

export interface AddTrackDTO {
	trackUri: string; // Universal track identifier from any music service
	title: string;
	artist: string;
	album?: string; // Optional - not all services have album info
	albumArt?: string;
	durationMs: number;
	previewUrl?: string;
}

export interface ReorderTracksDTO {
	trackIds: string[]; // Array of track IDs in new order
}

export interface AddCollaboratorDTO {
	userId: string;
}

export interface AddViewerDTO {
	userId: string;
}

// Response types (camelCase for client)
export interface TrackResponse {
	id: string;
	trackUri: string; // Universal track identifier from any music service
	title: string;
	artist: string;
	album?: string; // Optional - not all services have album info
	albumArt?: string;
	durationMs: number;
	previewUrl?: string;
	createdAt: string;
	updatedAt: string;
}

export interface PlaylistOwner {
	id: string;
	username: string;
	displayName?: string;
	avatarUrl?: string;
}

export interface PlaylistResponse {
	id: string;
	name: string;
	description?: string;
	coverUrl?: string;
	firstTrackCover?: string;
	ownerId: string;
	owner?: PlaylistOwner;
	collaboratorIds: string[];
	viewerIds: string[];
	visibility: 'public' | 'private';
	editMode: EditMode;
	trackCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface PlaylistWithTracksResponse extends PlaylistResponse {
	tracks: TrackWithPositionResponse[];
	owner: PlaylistOwner;
}

export interface TrackWithPositionResponse extends TrackResponse {
	position: number;
	addedBy: string | null;
	addedAt: string;
}
