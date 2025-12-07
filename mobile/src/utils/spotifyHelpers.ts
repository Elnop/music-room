import type { SpotifyTrack, Track } from '@types';

/**
 * Convert Spotify API track format to app internal Track format
 *
 * @param spotifyTrack - Track object from Spotify API
 * @returns Track object in app internal format
 */
export function convertSpotifyTrackToTrack(spotifyTrack: SpotifyTrack): Track {
  return {
    id: spotifyTrack.id,
    title: spotifyTrack.name,
    artist: spotifyTrack.artists.map(a => a.name).join(', '),
    album: spotifyTrack.album.name,
    albumArt: spotifyTrack.album.images[0]?.url || '',
    duration: spotifyTrack.duration_ms,
    spotifyUri: spotifyTrack.uri,
    previewUrl: spotifyTrack.preview_url || undefined,
  };
}
