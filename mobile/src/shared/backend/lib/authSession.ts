import { createStore } from 'zustand';
import type { StoreApi } from 'zustand';
import type { AuthSession, SessionView } from '@/shared/backend/types/sessionTypes';

const signedOut = createStore<SessionView>(() => ({
	user: null,
	accessToken: null,
	isAuthenticated: false,
}));

let authSession: AuthSession | null = null;

export function registerAuthSession(session: AuthSession): void {
	authSession = session;
}

export function getAuthSession(): AuthSession | null {
	return authSession;
}

export function sessionStore(): StoreApi<SessionView> {
	return authSession?.store ?? signedOut;
}

export function getSession(): SessionView {
	return sessionStore().getState();
}
