import { supabaseAdmin } from '@/shared/config/supabase.js';
import { OWNER_COLUMNS, toOwner } from '@/features/playlists/utils/playlist.helpers.js';
import { toSummaries, type TrackStats } from '@/features/playlists/utils/playlist-summaries.js';
import type {
	PlaylistOwner,
	PlaylistResponse,
	PlaylistRow,
} from '@/features/playlists/playlist.types.js';

// Errors are thrown as is; the caller maps them.

/** Track count and album art of the first track by rank, per playlist. */
export async function fetchTrackStats(playlistIds: string[]): Promise<TrackStats> {
	const { data: trackCounts, error: countError } = await supabaseAdmin
		.from('playlist_tracks')
		.select('playlist_id')
		.in('playlist_id', playlistIds);

	if (countError) throw countError;

	const counts: Record<string, number> = {};
	for (const row of trackCounts || []) {
		counts[row.playlist_id] = (counts[row.playlist_id] || 0) + 1;
	}

	const { data: allTracks, error: tracksError } = await supabaseAdmin
		.from('playlist_tracks')
		.select('playlist_id, rank, tracks:track_id(album_art)')
		.in('playlist_id', playlistIds)
		.order('rank', { ascending: true });

	if (tracksError) throw tracksError;

	const firstCovers: Record<string, string> = {};
	for (const row of allTracks || []) {
		if (firstCovers[row.playlist_id] !== undefined) continue;
		const track = row.tracks as { album_art?: string } | null;
		if (track?.album_art) firstCovers[row.playlist_id] = track.album_art;
	}

	return { counts, firstCovers };
}

async function fetchOwners(playlists: PlaylistRow[]): Promise<Record<string, PlaylistOwner>> {
	const ownerIds = [...new Set(playlists.map(p => p.owner_id))];
	const { data: owners, error } = await supabaseAdmin
		.from('user_profiles')
		.select(OWNER_COLUMNS)
		.in('id', ownerIds);

	if (error) throw error;

	const byId: Record<string, PlaylistOwner> = {};
	for (const owner of owners || []) byId[owner.id] = toOwner(owner);
	return byId;
}

export async function summarizeWithOwners(playlists: PlaylistRow[]): Promise<PlaylistResponse[]> {
	if (playlists.length === 0) return [];
	const stats = await fetchTrackStats(playlists.map(p => p.id));
	const owners = await fetchOwners(playlists);
	return toSummaries(playlists, stats, p => owners[p.owner_id]);
}
