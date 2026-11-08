import { createStore, useStore, type StoreApi } from 'zustand';
import type { UserProfile } from '@/types/user.types';

export interface SessionView {
	user: UserProfile | null;
	accessToken: string | null;
	isAuthenticated: boolean;
}

interface AuthSession {
	store: StoreApi<SessionView>;
	isTokenExpiringSoon: () => boolean;
	refreshAccessToken: () => Promise<boolean>;
	logout?: () => Promise<void>;
	setAvatarUrl?: (url: string | null) => Promise<void>;
	setUser?: (user: UserProfile) => void | Promise<void>;
}

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

export function getAuthSession(): AuthSession | null {
	return authSession;
}

const sessionStore = (): StoreApi<SessionView> => authSession?.store ?? signedOut;

export function getSession(): SessionView {
	return sessionStore().getState();
}

export function useSession<T>(selector: (session: SessionView) => T): T {
	return useStore(sessionStore(), selector);
}

export async function logout(): Promise<void> {
	await authSession?.logout?.();
}

export async function setAvatarUrl(url: string | null): Promise<void> {
	await authSession?.setAvatarUrl?.(url);
}

export async function setUser(user: UserProfile): Promise<void> {
	await authSession?.setUser?.(user);
}

export function onSessionEnd(listener: () => void): () => void {
	sessionEndListeners.add(listener);
	return () => sessionEndListeners.delete(listener);
}

export function notifySessionEnd(): void {
	sessionEndListeners.forEach(listener => listener());
}
