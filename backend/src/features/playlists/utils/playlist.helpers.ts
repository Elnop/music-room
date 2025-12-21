import { supabaseAdmin } from "@/shared/config/supabase.js";
import type {
  PlaylistRow,
  TrackRow,
  PlaylistResponse,
  PlaylistOwner,
  TrackResponse,
} from "../playlist.types.js";

/**
 * Format playlist row to response object
 */
export function formatPlaylistResponse(
  row: PlaylistRow,
  trackCount: number,
  owner?: PlaylistOwner,
  firstTrackCover?: string
): PlaylistResponse {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    coverUrl: row.cover_url,
    firstTrackCover,
    ownerId: row.owner_id,
    owner,
    collaboratorIds: row.collaborator_ids,
    viewerIds: row.viewer_ids,
    visibility: row.visibility,
    editMode: row.edit_mode,
    trackCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Format track row to response object
 */
export function formatTrackResponse(row: TrackRow): TrackResponse {
  return {
    id: row.id,
    trackUri: row.track_uri,
    title: row.title,
    artist: row.artist,
    album: row.album,
    albumArt: row.album_art,
    durationMs: row.duration_ms,
    previewUrl: row.preview_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Re-index track positions after deletion to close gaps
 * Ensures positions are sequential: 0, 1, 2, 3...
 */
export async function reindexPositions(playlistId: string): Promise<void> {
  const { data: tracks, error } = await supabaseAdmin
    .from("playlist_tracks")
    .select("*")
    .eq("playlist_id", playlistId)
    .order("position", { ascending: true });

  if (error) throw error;

  // Update positions only if they're out of sequence
  for (let i = 0; i < tracks.length; i++) {
    if (tracks[i].position !== i) {
      await supabaseAdmin
        .from("playlist_tracks")
        .update({ position: i })
        .eq("id", tracks[i].id);
    }
  }
}
