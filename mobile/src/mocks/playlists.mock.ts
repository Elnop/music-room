import type { Playlist, Track } from '@types';
import { getTracksByIds, MOCK_TRACKS } from './tracks.mock';

/**
 * Mock Playlists
 * Pre-defined playlists linked to mock users
 */
export const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: 'playlist-1',
    name: 'My Favorite Hits',
    description: 'All my favorite songs in one place',
    coverUrl: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
    ownerId: 'user-1', // demo user
    collaboratorIds: ['user-2'],
    trackIds: ['track-1', 'track-3', 'track-5', 'track-7', 'track-11'],
    visibility: 'public',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
  },
  {
    id: 'playlist-2',
    name: 'Workout Energy',
    description: 'High-energy tracks to power through your workout',
    coverUrl: 'https://i.scdn.co/image/ab67616d0000b273e0b60c608586d55d55f5e0de',
    ownerId: 'user-1', // demo user
    collaboratorIds: [],
    trackIds: ['track-2', 'track-9', 'track-13', 'track-14'],
    visibility: 'public',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-18T12:00:00Z',
  },
  {
    id: 'playlist-3',
    name: 'Chill Vibes',
    description: 'Relaxing music for studying and working',
    coverUrl: 'https://i.scdn.co/image/ab67616d0000b2732bb0e1c1d0d22e7f8d7e3c3c',
    ownerId: 'user-1', // demo user
    collaboratorIds: ['user-3', 'user-4'],
    trackIds: ['track-6', 'track-8', 'track-12', 'track-15', 'track-16', 'track-20'],
    visibility: 'private',
    createdAt: '2024-01-12T14:30:00Z',
    updatedAt: '2024-01-19T09:15:00Z',
  },
  {
    id: 'playlist-4',
    name: "Late Night Jams",
    description: 'Perfect tunes for midnight drives',
    coverUrl: 'https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452',
    ownerId: 'user-1', // demo user
    collaboratorIds: [],
    trackIds: ['track-1', 'track-11', 'track-8'],
    visibility: 'public',
    createdAt: '2024-01-14T11:20:00Z',
    updatedAt: '2024-01-21T16:45:00Z',
  },
  {
    id: 'playlist-5',
    name: 'Party Mix',
    description: 'Turn up the volume and dance!',
    coverUrl: 'https://i.scdn.co/image/ab67616d0000b273d6d0b6d0b6d0b6d0b6d0b6d0',
    ownerId: 'user-2', // alice
    collaboratorIds: ['user-1', 'user-5'],
    trackIds: ['track-2', 'track-4', 'track-10', 'track-14', 'track-17', 'track-18'],
    visibility: 'public',
    createdAt: '2024-01-08T09:00:00Z',
    updatedAt: '2024-01-20T10:30:00Z',
  },
];

/**
 * Helper: Find playlist by ID
 */
export const findPlaylistById = (id: string): Playlist | undefined => {
  return MOCK_PLAYLISTS.find(playlist => playlist.id === id);
};

/**
 * Helper: Get playlists for a user (owned or collaborating)
 */
export const getUserPlaylists = (userId: string): Playlist[] => {
  return MOCK_PLAYLISTS.filter(
    playlist =>
      playlist.ownerId === userId || playlist.collaboratorIds.includes(userId)
  );
};

/**
 * Helper: Get playlist tracks
 * Returns full Track objects for a playlist
 */
export const getPlaylistTracks = (playlistId: string) => {
  const playlist = findPlaylistById(playlistId);
  if (!playlist) {
    return [];
  }
  return getTracksByIds(playlist.trackIds);
};

/**
 * Helper: Get playlist track count
 */
export const getPlaylistTrackCount = (playlistId: string): number => {
  const playlist = findPlaylistById(playlistId);
  return playlist?.trackIds.length || 0;
};

/**
 * Helper: Check if user owns playlist
 */
export const isPlaylistOwner = (playlistId: string, userId: string): boolean => {
  const playlist = findPlaylistById(playlistId);
  return playlist?.ownerId === userId;
};

/**
 * Helper: Check if user is collaborator
 */
export const isPlaylistCollaborator = (
  playlistId: string,
  userId: string
): boolean => {
  const playlist = findPlaylistById(playlistId);
  return playlist?.collaboratorIds.includes(userId) || false;
};

/**
 * Helper: Check if user can edit playlist
 */
export const canEditPlaylist = (playlistId: string, userId: string): boolean => {
  return isPlaylistOwner(playlistId, userId) || isPlaylistCollaborator(playlistId, userId);
};

/**
 * Helper: Get public playlists
 */
export const getPublicPlaylists = (): Playlist[] => {
  return MOCK_PLAYLISTS.filter(playlist => playlist.visibility === 'public');
};

/**
 * Helper: Create new playlist (adds to MOCK_PLAYLISTS array)
 */
export const createMockPlaylist = (playlist: Playlist): void => {
  MOCK_PLAYLISTS.push(playlist);
};

/**
 * Helper: Update playlist
 */
export const updateMockPlaylist = (
  id: string,
  updates: Partial<Playlist>
): Playlist | undefined => {
  const index = MOCK_PLAYLISTS.findIndex(p => p.id === id);
  if (index === -1) {
    return undefined;
  }

  MOCK_PLAYLISTS[index] = {
    ...MOCK_PLAYLISTS[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return MOCK_PLAYLISTS[index];
};

/**
 * Helper: Delete playlist
 */
export const deleteMockPlaylist = (id: string): boolean => {
  const index = MOCK_PLAYLISTS.findIndex(p => p.id === id);
  if (index === -1) {
    return false;
  }

  MOCK_PLAYLISTS.splice(index, 1);
  return true;
};

/**
 * Helper: Add track to playlist
 * Accepts a full Track object and adds it to the mock tracks collection if needed
 */
export const addTrackToPlaylist = (playlistId: string, track: Track): boolean => {
  const playlist = findPlaylistById(playlistId);
  if (!playlist) {
    return false;
  }

  // Don't add if already exists
  if (playlist.trackIds.includes(track.id)) {
    return false;
  }

  // Add track to mock tracks collection if it doesn't exist yet (e.g., from Spotify)
  const trackExists = MOCK_TRACKS.find(t => t.id === track.id);
  if (!trackExists) {
    MOCK_TRACKS.push(track);
  }

  playlist.trackIds.push(track.id);
  playlist.updatedAt = new Date().toISOString();
  return true;
};

/**
 * Helper: Remove track from playlist
 */
export const removeTrackFromPlaylist = (
  playlistId: string,
  trackId: string
): boolean => {
  const playlist = findPlaylistById(playlistId);
  if (!playlist) {
    return false;
  }

  const index = playlist.trackIds.indexOf(trackId);
  if (index === -1) {
    return false;
  }

  playlist.trackIds.splice(index, 1);
  playlist.updatedAt = new Date().toISOString();
  return true;
};

/**
 * Helper: Reorder tracks in playlist
 */
export const reorderPlaylistTracks = (
  playlistId: string,
  trackIds: string[]
): boolean => {
  const playlist = findPlaylistById(playlistId);
  if (!playlist) {
    return false;
  }

  playlist.trackIds = trackIds;
  playlist.updatedAt = new Date().toISOString();
  return true;
};
