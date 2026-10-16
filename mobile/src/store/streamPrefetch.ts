/**
 * Stream URL of the queue's next item, fetched ahead of the track end (#314).
 * Held in memory only: stream URLs expire and are never persisted.
 */

// A stream URL this close to its expiry is renewed before play or seek (#313)
export const STREAM_RENEW_MARGIN_MS = 2 * 60 * 1000;

/** Whether a stream URL expiring at `expiresAt` (epoch ms) must be renewed before use. */
export function isStreamStale(expiresAt: number | null, now: number = Date.now()): boolean {
	return expiresAt !== null && expiresAt - now < STREAM_RENEW_MARGIN_MS;
}

export interface PrefetchedStream {
	/** Queue item the URL was fetched for. */
	queueItemId: string;
	/** SoundCloud permalink of that item's track. */
	permalink: string;
	streamUrl: string;
	/** Expiry in epoch ms, null when unknown. */
	expiresAt: number | null;
}

let held: PrefetchedStream | null = null;

export const streamPrefetch = {
	/** The entry held, if any. */
	peek(): PrefetchedStream | null {
		return held;
	},

	set(entry: PrefetchedStream): void {
		held = entry;
	},

	/**
	 * The held URL for this queue item and track, consumed. Null when the entry
	 * is for another item or track (the entry is kept), or when it is about to
	 * expire (the entry is dropped).
	 */
	take(
		queueItemId: string | null,
		permalink: string,
		now: number = Date.now()
	): PrefetchedStream | null {
		const entry = held;
		if (!entry || queueItemId === null) return null;
		if (entry.queueItemId !== queueItemId || entry.permalink !== permalink) return null;
		held = null;
		return isStreamStale(entry.expiresAt, now) ? null : entry;
	},

	clear(): void {
		held = null;
	},
};
