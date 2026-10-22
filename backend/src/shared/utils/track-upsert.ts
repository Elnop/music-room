import { z } from 'zod';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { Tables } from '@/shared/types/supabase.generated.js';

/**
 * Body of a track add to a playlist or the queue: the track's metadata.
 * `trackUri` is the SoundCloud permalink URL, never a stream URL.
 */
export const addTrackSchema = z.object({
	trackUri: z.string().min(1).max(500), // Universal track URI (SoundCloud permalink, etc.)
	title: z.string().min(1).max(200),
	artist: z.string().min(1).max(200),
	// Album is optional - SoundCloud and other services may not have album info
	album: z
		.string()
		.max(200)
		.optional()
		.transform(val => (val === '' ? undefined : val)),
	// Accept empty string or valid URL, transform empty string to undefined
	albumArt: z
		.string()
		.optional()
		.transform(val => (val === '' ? undefined : val))
		.pipe(z.url().optional()),
	durationMs: z.number().int().positive(),
	// Accept empty string or valid URL, transform empty string to undefined
	previewUrl: z
		.string()
		.optional()
		.transform(val => (val === '' ? undefined : val))
		.pipe(z.url().optional()),
});

/** The track as upsertTrack takes it: a parsed body, or one with fields left out. */
export type TrackUpsertInput = z.input<typeof addTrackSchema>;

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
