import * as Location from 'expo-location';
import { placeName } from '@/features/events/utils/geocoder';

export interface Coordinates {
	latitude: number;
	longitude: number;
}

/** Foreground only: Zumik never tracks the position in the background. */
export async function requestLocationPermission(): Promise<boolean> {
	const { status } = await Location.requestForegroundPermissionsAsync();
	return status === 'granted';
}

/** Needs the permission. Falls back to the coordinates when the place has no address. */
export async function currentPlace(): Promise<Coordinates & { address: string }> {
	const { coords } = await Location.getCurrentPositionAsync({
		accuracy: Location.Accuracy.Balanced,
	});
	const { latitude, longitude } = coords;
	const address =
		(await placeName({ latitude, longitude })) ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
	return { latitude, longitude, address };
}
