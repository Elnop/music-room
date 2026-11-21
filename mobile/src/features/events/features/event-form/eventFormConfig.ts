import { Platform } from 'react-native';

export const EVENT_LIMITS = {
	NAME_MAX: 100,
	TEXT_MAX: 500,
	ADDRESS_MAX: 200,
	GENRES_MAX: 5,
} as const;

export const GEOCODER_NEEDS_LOCATION_PERMISSION = Platform.OS !== 'web';
