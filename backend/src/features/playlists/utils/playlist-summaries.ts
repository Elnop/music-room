import { formatPlaylistResponse } from '@/features/playlists/utils/playlist.helpers.js';
import type {
	PlaylistOwner,
	PlaylistResponse,
	PlaylistRow,
} from '@/features/playlists/playlist.types.js';

export interface TrackStats {
	counts: Record<string, number>;
	firstCovers: Record<string, string>;
}

export function toSummaries(
	playlists: PlaylistRow[],
	stats: TrackStats,
	ownerOf: (playlist: PlaylistRow) => PlaylistOwner | undefined
): PlaylistResponse[] {
	return playlists.map(p =>
		formatPlaylistResponse(p, stats.counts[p.id] || 0, ownerOf(p), stats.firstCovers[p.id])
	);
}
