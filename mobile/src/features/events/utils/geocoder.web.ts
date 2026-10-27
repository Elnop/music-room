import { geocode } from '@/features/events/services/eventsApi';
import type { MusicEvent } from '@/features/events/types';

type Point = Pick<MusicEvent, 'latitude' | 'longitude'>;

/** The backend geocodes the typed address: the browser's position is not involved. */
export const geocoderNeedsLocationPermission = false;

/** expo-location has no geocoder on the web. Null when not found. */
export async function geocodeAddress(address: string): Promise<Point | null> {
	const place = await geocode(address);
	return place ? { latitude: place.latitude, longitude: place.longitude } : null;
}

/** Always null: a reverse lookup would send the user's position to the server. */
export async function placeName(_point: Point): Promise<string | null> {
	return null;
}
