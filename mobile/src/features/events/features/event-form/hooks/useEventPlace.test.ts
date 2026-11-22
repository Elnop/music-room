import { act, renderHook } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { showError } from '@/shared/theme/lib/toast';
import { logger } from '@/shared/logging/logger';
import { geocode } from '@/features/events/shared/location/lib/geocode';
import { useEventPlace } from '@/features/events/features/event-form/hooks/useEventPlace';

jest.mock('@/shared/theme/lib/toast', () => ({ showError: jest.fn() }));
jest.mock('expo-location', () => ({
	Accuracy: { Balanced: 3 },
	requestForegroundPermissionsAsync: jest.fn(),
	getCurrentPositionAsync: jest.fn(),
	reverseGeocodeAsync: jest.fn(),
	geocodeAsync: jest.fn(),
}));
jest.mock('@/features/events/shared/location/lib/geocode', () => ({ geocode: jest.fn() }));
jest.mock('@/features/events/shared/location/lib/geocoder', () =>
	jest.requireActual('@/features/events/shared/location/lib/geocoder.web'),
);
jest.mock('@/features/events/features/event-form/eventFormConfig', () => ({
	...jest.requireActual('@/features/events/features/event-form/eventFormConfig'),
	GEOCODER_NEEDS_LOCATION_PERMISSION: false,
}));

const location = jest.mocked(Location);
const lookup = jest.mocked(geocode);
const setAddress = jest.fn();

function renderPlace() {
	return renderHook(() => useEventPlace(undefined, setAddress)).result;
}

beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
	location.requestForegroundPermissionsAsync.mockResolvedValue({
		status: 'granted',
	} as Location.LocationPermissionResponse);
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('useEventPlace (web)', () => {
	it('geocodes a typed address through the backend, without asking for the position', async () => {
		lookup.mockResolvedValue({ latitude: 45.7, longitude: 4.8, displayName: 'Lyon' });
		const place = renderPlace();

		await expect(place.current.resolve('1 place Bellecour, Lyon')).resolves.toStrictEqual({
			latitude: 45.7,
			longitude: 4.8,
		});
		expect(lookup).toHaveBeenCalledWith('1 place Bellecour, Lyon');
		expect(location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
		expect(location.geocodeAsync).not.toHaveBeenCalled();
	});

	it('says when no place matches', async () => {
		lookup.mockResolvedValue(null);
		await expect(renderPlace().current.resolve('Nowhere')).resolves.toBeNull();
		expect(showError).toHaveBeenCalledWith(expect.stringContaining('Adresse introuvable'));
	});

	it('says when the lookup fails', async () => {
		lookup.mockRejectedValue(new Error('502'));
		await expect(renderPlace().current.resolve('Paris')).resolves.toBeNull();
		expect(showError).toHaveBeenCalledWith("Impossible de situer l'adresse pour le moment");
	});

	it('fills the browser position as coordinates, sending it nowhere', async () => {
		location.getCurrentPositionAsync.mockResolvedValue({
			coords: { latitude: 48.89664, longitude: 2.31836 },
		} as Location.LocationObject);
		const place = renderPlace();

		await act(async () => place.current.locateHere());

		expect(setAddress).toHaveBeenCalledWith('48.89664, 2.31836');
		expect(location.reverseGeocodeAsync).not.toHaveBeenCalled();
		expect(lookup).not.toHaveBeenCalled();
		await expect(place.current.resolve('48.89664, 2.31836')).resolves.toStrictEqual({
			latitude: 48.89664,
			longitude: 2.31836,
		});
	});

	it('explains a refused browser position', async () => {
		location.requestForegroundPermissionsAsync.mockResolvedValue({
			status: 'denied',
		} as Location.LocationPermissionResponse);
		const place = renderPlace();

		await act(async () => place.current.locateHere());

		expect(showError).toHaveBeenCalledWith(
			expect.stringContaining('Autorisez la localisation pour utiliser votre position'),
		);
		expect(location.getCurrentPositionAsync).not.toHaveBeenCalled();
		expect(setAddress).not.toHaveBeenCalled();
	});
});
