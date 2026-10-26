import type { Coordinates } from '@/features/events/utils/eventLocation';

const EARTH_RADIUS_M = 6_371_000;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance in metres (haversine formula). */
export function distanceMeters(from: Coordinates, to: Coordinates): number {
	const dLat = toRadians(to.latitude - from.latitude);
	const dLon = toRadians(to.longitude - from.longitude);
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLon / 2) ** 2;
	return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(meters: number): string {
	if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
	return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}
