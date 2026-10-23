import { act, renderHook } from '@testing-library/react-native';
import { createStore } from 'zustand';
import type { UserProfile } from '@/types/user.types';
import {
	getSession,
	notifySessionEnd,
	onSessionEnd,
	registerAuthSession,
	useSession,
	type SessionView,
} from './authSession';

describe('authSession', () => {
	it('reads signed out before the auth store registers', () => {
		expect(getSession()).toEqual({ user: null, accessToken: null, isAuthenticated: false });
	});

	it('reads the registered session, inside and outside React', () => {
		const store = createStore<SessionView>(() => ({
			user: null,
			accessToken: null,
			isAuthenticated: false,
		}));
		registerAuthSession({
			store,
			isTokenExpiringSoon: () => false,
			refreshAccessToken: async () => true,
		});
		const { result } = renderHook(() => useSession(session => session.user?.id ?? null));
		expect(result.current).toBeNull();

		act(() =>
			store.setState({
				user: { id: 'me' } as UserProfile,
				accessToken: 'token',
				isAuthenticated: true,
			})
		);

		expect(result.current).toBe('me');
		expect(getSession().accessToken).toBe('token');
	});

	it('tells each listener when the session ends, until it unsubscribes', () => {
		const listener = jest.fn();
		const unsubscribe = onSessionEnd(listener);

		notifySessionEnd();
		unsubscribe();
		notifySessionEnd();

		expect(listener).toHaveBeenCalledTimes(1);
	});
});
