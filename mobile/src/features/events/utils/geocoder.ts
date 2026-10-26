import * as Location from 'expo-location';
import type { MusicEvent } from '@/features/events/types';

type Point = Pick<MusicEvent, 'latitude' | 'longitude'>;

/** Android's geocoder needs the location permission, even for a typed address. */
export const geocoderNeedsLocationPermission = true;

function formatPlace(place: Location.LocationGeocodedAddress): string | null {
	const street = [place.streetNumber, place.street].filter(Boolean).join(' ');
	const city = [place.postalCode, place.city].filter(Boolean).join(' ');
	const text = [street || place.name, city].filter(Boolean).join(', ');
	return text || null;
}

/** Null when not found. */
export async function geocodeAddress(address: string): Promise<Point | null> {
	const [result] = await Location.geocodeAsync(address);
	return result ? { latitude: result.latitude, longitude: result.longitude } : null;
}

/** The address of a point, or null when it has none. */
export async function placeName(point: Point): Promise<string | null> {
	const [place] = await Location.reverseGeocodeAsync(point);
	return (place && formatPlace(place)) ?? null;
}
