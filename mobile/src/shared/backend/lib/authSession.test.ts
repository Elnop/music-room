import { act, renderHook } from '@testing-library/react-native';
import { createStore } from 'zustand';
import type { UserProfile } from '@/shared/users/userTypes';
import { getSession, registerAuthSession } from '@/shared/backend/lib/authSession';
import { notifySessionEnd, onSessionEnd } from '@/shared/backend/lib/sessionEnd';
import { useSession } from '@/shared/backend/hooks/useSession';
import type { SessionView } from '@/shared/backend/types/sessionTypes';

function selectUserId(session: SessionView): string | null {
	return session.user?.id ?? null;
}

describe('authSession', () => {
	it('reads signed out before the auth store registers', () => {
		expect(getSession()).toStrictEqual({ user: null, accessToken: null, isAuthenticated: false });
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
		const { result } = renderHook(() => useSession(selectUserId));
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
