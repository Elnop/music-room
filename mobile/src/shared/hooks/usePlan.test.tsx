import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChangePlan, usePlan } from './usePlan';
import { queryKeys } from '@/shared/query/keys';
import { subscriptionApi } from '@/shared/services/subscriptionApi';
import type { Subscription } from '@/shared/types/subscription';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.0.0' }));

jest.mock('@/shared/services/authSession', () => ({
	useSession: (selector: (s: { isAuthenticated: boolean }) => unknown) =>
		selector({ isAuthenticated: true }),
}));

jest.mock('@/shared/services/subscriptionApi', () => ({
	subscriptionApi: { getSubscription: jest.fn(), changePlan: jest.fn() },
}));

const FREE: Subscription = { plan: 'free', premiumFeatures: ['playlist_cover'] };
const PREMIUM: Subscription = { ...FREE, plan: 'premium' };

let client: QueryClient;

function wrapper({ children }: { children: React.ReactNode }) {
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

beforeEach(() => {
	jest.clearAllMocks();
	client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

afterEach(() => client.clear());

describe('usePlan', () => {
	it('reads the plan from GET /api/subscription', async () => {
		jest.mocked(subscriptionApi.getSubscription).mockResolvedValueOnce(PREMIUM);
		const { result } = renderHook(() => usePlan(), { wrapper });

		await waitFor(() => expect(result.current.plan).toBe('premium'));
		expect(result.current.isPremium).toBe(true);
	});
});

describe('useChangePlan', () => {
	it('switches the cached plan at once, then keeps the server answer', async () => {
		client.setQueryData(queryKeys.subscription.plan(), FREE);
		const request = deferred<Subscription>();
		jest.mocked(subscriptionApi.changePlan).mockReturnValueOnce(request.promise);
		const { result } = renderHook(() => useChangePlan(), { wrapper });

		act(() => result.current.mutate('premium'));
		await waitFor(() =>
			expect(client.getQueryData<Subscription>(queryKeys.subscription.plan())?.plan).toBe('premium')
		);

		await act(async () => request.resolve(PREMIUM));
		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(client.getQueryData(queryKeys.subscription.plan())).toEqual(PREMIUM);
	});

	it('puts the previous plan back when the request fails', async () => {
		client.setQueryData(queryKeys.subscription.plan(), FREE);
		jest.mocked(subscriptionApi.changePlan).mockRejectedValueOnce(new Error('offline'));
		const { result } = renderHook(() => useChangePlan(), { wrapper });

		act(() => result.current.mutate('premium'));

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(client.getQueryData(queryKeys.subscription.plan())).toEqual(FREE);
	});
});
