import { createStore, useStore, type StoreApi } from 'zustand';
import type { UserProfile } from '@/types/user.types';

/**
 * The session contract between the auth feature and the rest of the app. The
 * auth store registers itself here when it loads; the API client, the socket
 * and every other feature read the session and ask for a refresh through it,
 * so nothing outside `features/auth/` imports the feature
 * (architecture.md#layers, #no-cross-feature-imports).
 */

/** What any feature may read of the session. */
export interface SessionView {
	user: UserProfile | null;
	accessToken: string | null;
	isAuthenticated: boolean;
}

interface AuthSession {
	/** The session store (the auth store, seen through `SessionView`). */
	store: StoreApi<SessionView>;
	isTokenExpiringSoon: () => boolean;
	refreshAccessToken: () => Promise<boolean>;
}

/** Signed out until the auth store registers: before that, nothing is read. */
const signedOut = createStore<SessionView>(() => ({
	user: null,
	accessToken: null,
	isAuthenticated: false,
}));

let authSession: AuthSession | null = null;
const sessionEndListeners = new Set<() => void>();

export function registerAuthSession(session: AuthSession): void {
	authSession = session;
}

/** The registered session, or null before the auth store has loaded. */
export function getAuthSession(): AuthSession | null {
	return authSession;
}

const sessionStore = (): StoreApi<SessionView> => authSession?.store ?? signedOut;

/** The session now, outside React (stores, services). */
export function getSession(): SessionView {
	return sessionStore().getState();
}

/** One value of the session, re-rendering when it changes: `useSession(s => s.user?.id)`. */
export function useSession<T>(selector: (session: SessionView) => T): T {
	return useStore(sessionStore(), selector);
}

/**
 * Runs `listener` at every end of session (logout, refused refresh); returns
 * the unsubscribe function.
 */
export function onSessionEnd(listener: () => void): () => void {
	sessionEndListeners.add(listener);
	return () => sessionEndListeners.delete(listener);
}

/** Called by the auth store when a signed-in session ends. */
export function notifySessionEnd(): void {
	sessionEndListeners.forEach(listener => listener());
}
