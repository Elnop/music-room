import { z } from 'zod';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { takeUpstreamSlot } from '@/shared/security/upstream-slot.js';
import * as geocodeCache from '@/features/events/services/geocode-cache.service.js';
import type { GeocodedPlace } from '@/features/events/events.types.js';

// Nominatim's usage policy: one request per second for the whole application, and a User-Agent
// that identifies it.
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'Zumik/1.0 (+https://github.com/Elnop/music-room)';
const SLOT = { intervalMs: 1000, maxWaitMs: 3000 };
const TIMEOUT_MS = 5000;

const nominatimResultsSchema = z.array(
	z.object({ lat: z.coerce.number(), lon: z.coerce.number(), display_name: z.string() })
);

function unavailable(): AppError {
	return new AppError(502, 'Address lookup is unavailable', 'GEOCODER_UNAVAILABLE');
}

async function search(query: string): Promise<unknown> {
	const url = new URL(NOMINATIM_SEARCH_URL);
	url.search = new URLSearchParams({ format: 'jsonv2', limit: '1', q: query }).toString();
	try {
		const response = await fetch(url, {
			headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
			signal: AbortSignal.timeout(TIMEOUT_MS),
		});
		if (!response.ok) {
			logger.warn('Nominatim refused the lookup', { status: response.status });
			throw unavailable();
		}
		return await response.json();
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.warn('Nominatim lookup failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		throw unavailable();
	}
}

/** A cache hit never reaches here, so it takes no upstream slot. */
async function lookup(address: string): Promise<GeocodedPlace | null> {
	await takeUpstreamSlot('nominatim', SLOT);
	const parsed = nominatimResultsSchema.safeParse(await search(address));
	if (!parsed.success) {
		logger.warn('Nominatim answered an unexpected shape');
		throw unavailable();
	}
	const [first] = parsed.data;
	if (!first) return null;
	return { latitude: first.lat, longitude: first.lon, displayName: first.display_name };
}

/** Null when nothing matches. Only the address is sent: never a user's position. */
export async function geocodeAddress(address: string): Promise<GeocodedPlace | null> {
	const cached = await geocodeCache.read(address);
	if (cached !== undefined) return cached;
	const place = await lookup(address);
	await geocodeCache.write(address, place);
	return place;
}
