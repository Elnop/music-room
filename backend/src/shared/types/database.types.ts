/**
 * Database Row Types
 * Types for raw database rows from Supabase queries
 */

export interface UserProfileRow {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  google_id: string | null;
  facebook_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaylistRow {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  owner_id: string;
  collaborator_ids: string[];
  viewer_ids: string[];
  visibility: 'public' | 'private';
  edit_mode: 'open' | 'restricted';
  created_at: string;
  updated_at: string;
}

export interface TrackRow {
  id: string;
  track_uri: string;
  title: string;
  artist: string;
  album: string | null;
  album_art: string | null;
  duration_ms: number;
  preview_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaylistTrackRow {
  playlist_id: string;
  track_id: string;
  position: number;
  added_by: string;
  created_at: string;
}

export interface FollowRow {
  follower_id: string;
  following_id: string;
  can_control_music: boolean;
  created_at: string;
}
