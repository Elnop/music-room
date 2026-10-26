import * as Location from 'expo-location';

export interface Coordinates {
	latitude: number;
	longitude: number;
}

/** Foreground only: Zumik never tracks the position in the background. */
export async function requestLocationPermission(): Promise<boolean> {
	const { status } = await Location.requestForegroundPermissionsAsync();
	return status === 'granted';
}

function formatPlace(place: Location.LocationGeocodedAddress): string | null {
	const street = [place.streetNumber, place.street].filter(Boolean).join(' ');
	const city = [place.postalCode, place.city].filter(Boolean).join(' ');
	const text = [street || place.name, city].filter(Boolean).join(', ');
	return text || null;
}

/** Needs the permission. Falls back to the coordinates when the place has no address. */
export async function currentPlace(): Promise<Coordinates & { address: string }> {
	const { coords } = await Location.getCurrentPositionAsync({
		accuracy: Location.Accuracy.Balanced,
	});
	const { latitude, longitude } = coords;
	const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
	const address =
		(place && formatPlace(place)) ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
	return { latitude, longitude, address };
}

/** Android's geocoder needs the location permission, even for a typed address. Null when not found. */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
	const [result] = await Location.geocodeAsync(address);
	return result ? { latitude: result.latitude, longitude: result.longitude } : null;
}
