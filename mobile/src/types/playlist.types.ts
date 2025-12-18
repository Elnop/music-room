import type { TrackWithPosition } from './track.types';
import type { UserProfile } from './user.types';

// Playlist Types (Mock-friendly structure)
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  ownerId: string;
  collaboratorIds: string[];
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
