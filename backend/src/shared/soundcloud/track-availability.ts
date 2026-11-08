import { supabaseAdmin } from '@/shared/config/supabase.js';
import { logger } from '@/shared/utils/logger.js';
import { soundcloud } from '@/shared/soundcloud/soundcloud-client.js';

type TrackAvailability = 'available' | 'unavailable' | 'unknown';

interface PlayabilityFields {
	policy?: string;
	media?: { transcodings?: { format?: { protocol?: string } }[] };
}

const PLAYABLE_PROTOCOLS = new Set(['hls', 'progressive']);

export function isPlayable(track: PlayabilityFields): boolean {
	if (track.policy === 'BLOCK') return false;
	return (track.media?.transcodings ?? []).some(transcoding =>
		PLAYABLE_PROTOCOLS.has(transcoding.format?.protocol ?? '')
	);
}

export async function checkTrackAvailability(trackUri: string): Promise<TrackAvailability> {
	try {
		const track = (await soundcloud.tracks.get(trackUri)) as PlayabilityFields;
		return isPlayable(track) ? 'available' : 'unavailable';
	} catch (error) {
		if (error instanceof Error && error.message === 'Status code 404') return 'unavailable';
		logger.warn('Track availability check failed', {
			trackUri,
			error: error instanceof Error ? error.message : String(error),
		});
		return 'unknown';
	}
}

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

export async function markTrackUriUnavailable(trackUri: string): Promise<void> {
	const now = new Date().toISOString();
	const { error } = await supabaseAdmin
		.from('tracks')
		.update({ unavailable_at: now, availability_checked_at: now })
		.eq('track_uri', trackUri)
		.is('unavailable_at', null);
	if (error) logger.error('Failed to mark track unavailable', { trackUri, error: error.message });
}
