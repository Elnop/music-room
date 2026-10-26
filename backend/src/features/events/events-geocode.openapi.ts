import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { geocodeQuerySchema } from '@/features/events/events.validators.js';
import { geocodeResponseSchema } from '@/features/events/events-responses.validators.js';
import { bearerAuth, ok } from '@/shared/config/swagger.schemas.js';
import { fail, shared } from '@/shared/config/swagger.errors.js';

export function registerEventsGeocodeOpenapi(registry: OpenAPIRegistry): void {
	registry.registerPath({
		tags: ['Events'],
		security: bearerAuth,
		method: 'get',
		path: '/api/events/geocode',
		summary: 'Find the coordinates of an address',
		description:
			"For clients without a geocoder of their own (the web app): the backend asks OpenStreetMap's Nominatim. Only the typed address is sent, never a position. Rate-limited per user (`RATE_LIMIT_GEOCODE_*`), and to one Nominatim request per second for the whole backend: a request waits up to 3 s for its turn, then gets 429.",
		operationId: 'geocodeAddress',
		request: { query: geocodeQuerySchema },
		responses: {
			200: ok('The best match, or `location: null`', geocodeResponseSchema),
			400: shared('ValidationError'),
			401: shared('UnauthorizedError'),
			429: shared('RateLimitError'),
			502: fail('GEOCODER_UNAVAILABLE: Nominatim failed or did not answer in time', [
				'GEOCODER_UNAVAILABLE',
				'Address lookup is unavailable',
			]),
			503: shared('RateLimitUnavailable'),
		},
	});
}
