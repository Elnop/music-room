import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';
import type { QueueTrack } from '@/types/queue.types';
import { logger } from '@/utils/logger';

/**
 * The track the player held when the app was last used, per user (#312). Stored
 * on the device: no stream URL (they expire) and no token, only what rebuilds a
 * paused player at start-up.
 */
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
	try {
		await AsyncStorage.setItem(keyFor(userId), JSON.stringify(parsed.data));
	} catch (error) {
		logger.warn('[lastTrackStorage] Save failed', error);
	}
}

async function clear(userId: string): Promise<void> {
	try {
		await AsyncStorage.removeItem(keyFor(userId));
	} catch (error) {
		logger.warn('[lastTrackStorage] Clear failed', error);
	}
}

/** The saved entry of `userId`, or null; a corrupt or unreadable entry is deleted. */
async function load(userId: string): Promise<LastTrackEntry | null> {
	let raw: string | null;
	try {
		raw = await AsyncStorage.getItem(keyFor(userId));
	} catch (error) {
		logger.warn('[lastTrackStorage] Load failed', error);
		await clear(userId);
		return null;
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
