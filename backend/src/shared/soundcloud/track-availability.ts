import { supabaseAdmin } from '@/shared/config/supabase.js';
import { logger } from '@/shared/utils/logger.js';
import { soundcloud } from '@/shared/soundcloud/soundcloud-client.js';

type TrackAvailability = 'available' | 'unavailable' | 'unknown';

interface PlayabilityFields {
	policy?: string;
	streamable?: boolean;
	media?: { transcodings?: unknown[] };
}

/** A SNIP track (30-second preview only) stays playable; a BLOCK one is blocked in the region. */
export function isPlayable(track: PlayabilityFields): boolean {
	if (track.policy === 'BLOCK') return false;
	return Boolean(track.streamable || track.media?.transcodings?.length);
}

/** 'unknown' when SoundCloud could not answer: the stored state is kept. */
export async function checkTrackAvailability(trackUri: string): Promise<TrackAvailability> {
	try {
		const track = (await soundcloud.tracks.get(trackUri)) as PlayabilityFields;
		return isPlayable(track) ? 'available' : 'unavailable';
	} catch (error) {
		// soundcloud.ts reports an HTTP error only through this message.
		if (error instanceof Error && error.message === 'Status code 404') return 'unavailable';
		logger.warn('Track availability check failed', {
			trackUri,
			error: error instanceof Error ? error.message : String(error),
		});
		return 'unknown';
	}
}

/** Keeps the first unavailable_at of a track that stays unavailable. */
export async function saveTrackAvailability(
	trackId: string,
	unavailable: boolean,
	previousUnavailableAt: string | null
): Promise<void> {
	const now = new Date().toISOString();
	const { error } = await supabaseAdmin
		.from('tracks')
		.update({
			unavailable_at: unavailable ? (previousUnavailableAt ?? now) : null,
			availability_checked_at: now,
		})
		.eq('id', trackId);
	if (error) throw error;
}

/** For a track whose stream SoundCloud no longer gives; never throws. */
export async function markTrackUriUnavailable(trackUri: string): Promise<void> {
	const now = new Date().toISOString();
	const { error } = await supabaseAdmin
		.from('tracks')
		.update({ unavailable_at: now, availability_checked_at: now })
		.eq('track_uri', trackUri)
		.is('unavailable_at', null);
	if (error) logger.error('Failed to mark track unavailable', { trackUri, error: error.message });
}
