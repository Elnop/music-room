import { ApiError } from '@/shared/services/api';
import { STALE, createQueryClient, shouldRetry } from './queryClient';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/services/deviceService', () => ({ getAppVersion: () => '1.0.0' }));

describe('queryClient', () => {
	it('orders the cache profiles from never fresh to long-lived', () => {
		expect(STALE.none).toBe(0);
		expect(STALE.short).toBeGreaterThan(STALE.none);
		expect(STALE.long).toBeGreaterThan(STALE.short);
	});

	it('uses the short profile and the retry policy by default, never retrying mutations', () => {
		const client = createQueryClient();
		const defaults = client.getDefaultOptions();

		expect(defaults.queries?.staleTime).toBe(STALE.short);
		expect(defaults.queries?.retry).toBe(shouldRetry);
		expect(defaults.mutations?.retry).toBe(false);
	});

	it('creates a new client on each call', () => {
		expect(createQueryClient()).not.toBe(createQueryClient());
	});

	describe('shouldRetry', () => {
		it('never retries a 4xx', () => {
			expect(shouldRetry(0, new ApiError('Not found', 'NOT_FOUND', undefined, 404))).toBe(false);
			expect(shouldRetry(0, new ApiError('Denied', 'FORBIDDEN', undefined, 403))).toBe(false);
		});

		it('retries a 5xx or a network error, twice at most', () => {
			const serverError = new ApiError('Oops', 'INTERNAL_ERROR', undefined, 500);
			const networkError = new ApiError('Offline', 'NETWORK_ERROR');

			expect(shouldRetry(0, serverError)).toBe(true);
			expect(shouldRetry(1, networkError)).toBe(true);
			expect(shouldRetry(2, serverError)).toBe(false);
		});

		it('retries an unknown error', () => {
			expect(shouldRetry(0, new Error('boom'))).toBe(true);
		});
	});
});
