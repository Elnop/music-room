import { geocode } from './eventsApi';
import type { MusicEvent } from '@/features/events/lib/types';

type Point = Pick<MusicEvent, 'latitude' | 'longitude'>;

export const geocoderNeedsLocationPermission = false;

export async function geocodeAddress(address: string): Promise<Point | null> {
	const place = await geocode(address);
	return place ? { latitude: place.latitude, longitude: place.longitude } : null;
}

export async function placeName(_point: Point): Promise<string | null> {
	return null;
}
