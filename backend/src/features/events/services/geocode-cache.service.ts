import { createHash } from 'node:crypto';
import { redisClient, isRedisConnected } from '@/shared/config/redis.js';
import { logger } from '@/shared/utils/logger.js';
import { geocodedPlaceSchema } from '@/features/events/events-responses.validators.js';
import type { GeocodedPlace } from '@/features/events/events.types.js';

const KEY_PREFIX = 'geocode:';
const TTL_SECONDS = 7 * 24 * 3600;

const cachedSchema = geocodedPlaceSchema.nullable();

function keyFor(address: string): string {
	const normalized = address.trim().replace(/\s+/g, ' ').toLowerCase();
	return KEY_PREFIX + createHash('sha256').update(normalized).digest('hex');
}

function logFailure(operation: string, error: unknown): void {
	logger.warn('Geocode cache unavailable', {
		operation,
		error: error instanceof Error ? error.message : 'Unknown error',
	});
}

export async function read(address: string): Promise<GeocodedPlace | null | undefined> {
	if (!isRedisConnected()) return undefined;
	try {
		const raw = await redisClient.get(keyFor(address));
		if (raw === null) return undefined;
		const parsed = cachedSchema.safeParse(JSON.parse(raw));
		return parsed.success ? parsed.data : undefined;
	} catch (error) {
		logFailure('read', error);
		return undefined;
	}
}

export async function write(address: string, place: GeocodedPlace | null): Promise<void> {
	if (!isRedisConnected()) return;
	try {
		await redisClient.setex(keyFor(address), TTL_SECONDS, JSON.stringify(place));
	} catch (error) {
		logFailure('write', error);
	}
}
