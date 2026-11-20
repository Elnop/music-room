import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import type { QueueTrack } from './queue.types';

/** No stream URL (they expire) and no token: only what rebuilds a paused player. */
export interface LastTrackEntry {
	track: QueueTrack;
	queueItemId: string | null;
	positionMs: number;
}

const entrySchema = z.object({
	track: z.object({
		trackUri: z.string().min(1),
		title: z.string(),
		artist: z.string(),
		album: z.string().nullable(),
		albumArt: z.string().nullable(),
		durationMs: z.number().nonnegative(),
	}),
	queueItemId: z.string().nullable(),
	positionMs: z.number().nonnegative(),
});

const keyFor = (userId: string) => `zumik:lastTrack:${userId}`;

async function save(userId: string, entry: LastTrackEntry): Promise<void> {
	const parsed = entrySchema.safeParse(entry);
	// An invalid snapshot must not leave an older track to restore.
	if (!parsed.success) return clear(userId);
	await AsyncStorage.setItem(keyFor(userId), JSON.stringify(parsed.data));
}

async function clear(userId: string): Promise<void> {
	await AsyncStorage.removeItem(keyFor(userId));
}

async function load(userId: string): Promise<LastTrackEntry | null> {
	let raw: string | null;
	try {
		raw = await AsyncStorage.getItem(keyFor(userId));
	} catch (error) {
		await clear(userId).catch(() => undefined);
		throw error;
	}
	if (raw === null) return null;
	try {
		const parsed = entrySchema.safeParse(JSON.parse(raw));
		if (parsed.success) return parsed.data;
	} catch {
		// Invalid JSON: deleted below.
	}
	await clear(userId);
	return null;
}

export const lastTrackStorage = { save, load, clear };
