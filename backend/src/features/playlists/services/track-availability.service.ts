import { supabaseAdmin } from '@/shared/config/supabase.js';
import { logger } from '@/shared/utils/logger.js';
import * as availability from '@/shared/soundcloud/track-availability.js';
import * as realtime from '@/realtime/emitters/playlist.emitters.js';
import type { TracksAvailabilityPayload } from '@/features/playlists/playlist.types.js';

export const RECHECK_AFTER_MS = 24 * 60 * 60 * 1000;
// One SoundCloud lookup per track: a few at a time keeps a long playlist under its rate limit.
const CONCURRENCY = 4;

interface StoredTrack {
	id: string;
	track_uri: string;
	unavailable_at: string | null;
	availability_checked_at: string | null;
}

// Two clients opening the same playlist must not check its tracks twice.
const checking = new Set<string>();

/** Rechecks the tracks not checked for RECHECK_AFTER_MS and broadcasts the changes; never throws. */
export async function refreshPlaylistAvailability(playlistId: string): Promise<void> {
	try {
		const due = (await playlistTracks(playlistId)).filter(
			track => isDue(track) && !checking.has(track.id)
		);
		if (due.length === 0) return;
		due.forEach(track => checking.add(track.id));

		const changed: TracksAvailabilityPayload['tracks'] = [];
		try {
			await forEachLimited(due, async track => {
				const change = await recheck(track);
				if (change) changed.push(change);
			});
		} finally {
			due.forEach(track => checking.delete(track.id));
		}

		logger.info('Playlist availability checked', {
			playlistId,
			checked: due.length,
			changed: changed.length,
		});
		if (changed.length > 0) realtime.notifyTracksAvailability({ playlistId, tracks: changed });
	} catch (error) {
		logger.error('Playlist availability check failed', {
			playlistId,
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

async function playlistTracks(playlistId: string): Promise<StoredTrack[]> {
	const { data, error } = await supabaseAdmin
		.from('playlist_tracks')
		.select('tracks:track_id (id, track_uri, unavailable_at, availability_checked_at)')
		.eq('playlist_id', playlistId);
	if (error) throw error;
	return data.map(row => row.tracks);
}

function isDue(track: StoredTrack, now = Date.now()): boolean {
	const checkedAt = track.availability_checked_at;
	return checkedAt === null || now - new Date(checkedAt).getTime() >= RECHECK_AFTER_MS;
}

async function recheck(track: StoredTrack): Promise<{ trackId: string; unavailable: boolean } | null> {
	const result = await availability.checkTrackAvailability(track.track_uri);
	if (result === 'unknown') return null;
	const unavailable = result === 'unavailable';
	await availability.saveTrackAvailability(track.id, unavailable, track.unavailable_at);
	const wasUnavailable = track.unavailable_at !== null;
	return unavailable === wasUnavailable ? null : { trackId: track.id, unavailable };
}

async function forEachLimited<T>(items: T[], run: (item: T) => Promise<void>): Promise<void> {
	let next = 0;
	const worker = async () => {
		while (next < items.length) await run(items[next++]);
	};
	await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker));
}
