import * as Location from 'expo-location';
import { placeName } from '@/features/events/utils/geocoder';

export interface Coordinates {
	latitude: number;
	longitude: number;
}

export async function requestLocationPermission(): Promise<boolean> {
	const { status } = await Location.requestForegroundPermissionsAsync();
	return status === 'granted';
}

export async function currentPlace(): Promise<Coordinates & { address: string }> {
	const { coords } = await Location.getCurrentPositionAsync({
		accuracy: Location.Accuracy.Balanced,
	});
	const { latitude, longitude } = coords;
	const address =
		(await placeName({ latitude, longitude })) ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
	return { latitude, longitude, address };
}
