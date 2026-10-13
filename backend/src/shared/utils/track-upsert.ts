import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { Tables } from '@/shared/types/supabase.generated.js';

/** Track metadata a client sends to add a track to a playlist or the queue. */
export interface TrackUpsertInput {
	trackUri: string; // SoundCloud permalink URL, never a stream URL
	title: string;
	artist: string;
	album?: string;
	albumArt?: string;
	durationMs: number;
	previewUrl?: string;
}

/**
 * Inserts the track, or refreshes its metadata when its `track_uri` is
 * already known, and returns its row. Shared by playlist and queue adds.
 */
export async function upsertTrack(track: TrackUpsertInput): Promise<Tables<'tracks'>> {
	const { data, error } = await supabaseAdmin
		.from('tracks')
		.upsert(
			{
				track_uri: track.trackUri,
				title: track.title,
				artist: track.artist,
				album: track.album,
				album_art: track.albumArt,
				duration_ms: track.durationMs,
				preview_url: track.previewUrl,
			},
			{ onConflict: 'track_uri' }
		)
		.select()
		.single();
	if (error) {
		logger.error('Failed to upsert track', { error, trackUri: track.trackUri });
		throw new AppError(500, 'Failed to add track', 'TRACK_ADD_ERROR');
	}
	return data;
}
