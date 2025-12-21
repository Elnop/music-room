import type { TrackWithPosition } from './track.types';
import type { UserProfile } from './user.types';

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
  ownerId: string;
  owner?: PlaylistOwner;
  collaboratorIds: string[];
  viewerIds: string[];
  trackCount: number;
  visibility: 'public' | 'private';
  createdAt: string;
  updatedAt: string;
}

// Playlist with full track data and owner info
export interface PlaylistWithTracks extends Omit<Playlist, 'trackCount'> {
  tracks: TrackWithPosition[];
  owner: UserProfile;
}
