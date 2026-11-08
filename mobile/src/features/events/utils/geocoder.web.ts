import { geocode } from '@/features/events/services/eventsApi';
import type { MusicEvent } from '@/features/events/types';

type Point = Pick<MusicEvent, 'latitude' | 'longitude'>;

export const geocoderNeedsLocationPermission = false;

export async function geocodeAddress(address: string): Promise<Point | null> {
	const place = await geocode(address);
	return place ? { latitude: place.latitude, longitude: place.longitude } : null;
}

export async function placeName(_point: Point): Promise<string | null> {
	return null;
}
