import { geocode } from '@/features/events/shared/location/lib/geocode';
import type { MusicEvent } from '@/features/events/eventTypes';

type Point = Pick<MusicEvent, 'latitude' | 'longitude'>;

export async function geocodeAddress(address: string): Promise<Point | null> {
	const place = await geocode(address);
	return place ? { latitude: place.latitude, longitude: place.longitude } : null;
}

export async function placeName(_point: Point): Promise<string | null> {
	return null;
}
