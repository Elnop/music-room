import type { PrefetchedStream } from '@/features/player/types';

export const STREAM_RENEW_MARGIN_MS = 2 * 60 * 1000;

export function isStreamStale(expiresAt: number | null, now: number = Date.now()): boolean {
	return expiresAt !== null && expiresAt - now < STREAM_RENEW_MARGIN_MS;
}

let held: PrefetchedStream | null = null;

export const streamPrefetch = {
	peek(): PrefetchedStream | null {
		return held;
	},

	set(entry: PrefetchedStream): void {
		held = entry;
	},

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
