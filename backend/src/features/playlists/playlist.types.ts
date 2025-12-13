/**
 * Playlist DTOs and Types
 */

// Database types (snake_case from DB)
export interface PlaylistRow {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  owner_id: string;
  collaborator_ids: string[];
  visibility: 'public' | 'private';
  created_at: string;
  updated_at: string;
}

export interface TrackRow {
  id: string;
  track_uri: string; // Universal track identifier from any music service
  title: string;
  artist: string;
  album: string;
  album_art?: string;
  duration_ms: number;
  preview_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PlaylistTrackRow {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  added_by: string | null;
  added_at: string;
}

// DTOs for API requests
export interface CreatePlaylistDTO {
  name: string;
  description?: string;
  visibility: 'public' | 'private';
}

export interface UpdatePlaylistDTO {
  name?: string;
  description?: string;
  visibility?: 'public' | 'private';
}

export interface AddTrackDTO {
  trackUri: string; // Universal track identifier from any music service
  title: string;
  artist: string;
  album: string;
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

// Response types (camelCase for client)
export interface TrackResponse {
  id: string;
  trackUri: string; // Universal track identifier from any music service
  title: string;
  artist: string;
  album: string;
  albumArt?: string;
  durationMs: number;
  previewUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistResponse {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  ownerId: string;
  collaboratorIds: string[];
  visibility: 'public' | 'private';
  trackCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistWithTracksResponse extends PlaylistResponse {
  tracks: TrackWithPositionResponse[];
  owner: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
}

export interface TrackWithPositionResponse extends TrackResponse {
  position: number;
  addedBy: string | null;
  addedAt: string;
}
