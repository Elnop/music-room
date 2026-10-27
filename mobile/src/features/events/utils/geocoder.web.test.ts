import { resetBackendUrl } from '@/shared/services/backendUrl';
import { mockFetchRoutes } from '@/test/fetchRoutes';
import { fail, ok } from '@/test/fetchResponses';
import { signIn } from '@/test/session';
import {
	geocodeAddress,
	geocoderNeedsLocationPermission,
	placeName,
} from '@/features/events/utils/geocoder.web';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.2.3' }));

const ADDRESS = '96 bd Bessières, 75017 Paris';
const ROUTE = `GET /api/events/geocode?q=${encodeURIComponent(ADDRESS)}`;

beforeEach(async () => {
	await resetBackendUrl();
	signIn('me');
});

describe('geocoder (web)', () => {
	it('needs no location permission', () => {
		expect(geocoderNeedsLocationPermission).toBe(false);
	});

	it('asks the backend with the typed address only', async () => {
		const { calls } = mockFetchRoutes({
			[ROUTE]: ok({ location: { latitude: 48.9, longitude: 2.3, displayName: 'Paris' } }),
		});

		await expect(geocodeAddress(ADDRESS)).resolves.toEqual({ latitude: 48.9, longitude: 2.3 });
		expect(calls()).toEqual([ROUTE]);
	});

	it('answers null when the backend finds nothing', async () => {
		mockFetchRoutes({ [ROUTE]: ok({ location: null }) });
		await expect(geocodeAddress(ADDRESS)).resolves.toBeNull();
	});

	it('rejects when the geocoder is unavailable', async () => {
		mockFetchRoutes({ [ROUTE]: fail(502, 'GEOCODER_UNAVAILABLE') });
		await expect(geocodeAddress(ADDRESS)).rejects.toMatchObject({ code: 'GEOCODER_UNAVAILABLE' });
	});

	it('never names a position, which would send it to the server', async () => {
		const { fetchMock } = mockFetchRoutes({});
		await expect(placeName({ latitude: 48.9, longitude: 2.3 })).resolves.toBeNull();
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
