import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '@/types/user.types';
import { logger } from '@/shared/utils/logger';

/** Storage module of the auth store (guardrails.md#no-asyncstorage-outside-storage). */
interface StoredSession {
	user: UserProfile;
	accessToken: string;
	refreshToken: string | null;
	/** Milliseconds since the epoch. */
	tokenExpiresAt: number | null;
}

const KEYS = {
	user: '@zumik/auth_user',
	accessToken: '@zumik/access_token',
	refreshToken: '@zumik/refresh_token',
	isAuthenticated: '@zumik/is_authenticated',
	tokenExpiresAt: '@zumik/token_expires_at',
} as const;

/** Session key of the auth SDK older builds used (`sb-<project ref>-auth-token`). */
const LEGACY_SDK_SESSION_KEY = /^sb-.+-auth-token$/;

/** Older builds also kept the auth SDK's session in AsyncStorage; nothing reads or revokes it any more. */
async function removeLegacySdkSession(): Promise<void> {
	const keys = await AsyncStorage.getAllKeys();
	const legacy = keys.filter(key => LEGACY_SDK_SESSION_KEY.test(key));
	if (legacy.length > 0) await AsyncStorage.multiRemove(legacy);
}

/** Null when there is none; throws when unreadable (a corrupt user): the caller clears it. */
async function load(): Promise<StoredSession | null> {
	await removeLegacySdkSession();
	const [userJson, accessToken, refreshToken, isAuthenticated, expiresAt] = await Promise.all([
		AsyncStorage.getItem(KEYS.user),
		AsyncStorage.getItem(KEYS.accessToken),
		AsyncStorage.getItem(KEYS.refreshToken),
		AsyncStorage.getItem(KEYS.isAuthenticated),
		AsyncStorage.getItem(KEYS.tokenExpiresAt),
	]);
	if (!userJson || !accessToken || isAuthenticated !== 'true') return null;
	return {
		user: JSON.parse(userJson) as UserProfile,
		accessToken,
		refreshToken,
		tokenExpiresAt: expiresAt ? parseInt(expiresAt, 10) : null,
	};
}

async function save(session: StoredSession): Promise<void> {
	try {
		await Promise.all([
			AsyncStorage.setItem(KEYS.user, JSON.stringify(session.user)),
			AsyncStorage.setItem(KEYS.accessToken, session.accessToken),
			AsyncStorage.setItem(KEYS.refreshToken, session.refreshToken || ''),
			AsyncStorage.setItem(KEYS.isAuthenticated, 'true'),
			AsyncStorage.setItem(KEYS.tokenExpiresAt, session.tokenExpiresAt?.toString() || ''),
		]);
	} catch (error) {
		logger.error('Failed to save auth state to storage:', error);
	}
}

async function clear(): Promise<void> {
	try {
		await Promise.all([
			...Object.values(KEYS).map(key => AsyncStorage.removeItem(key)),
			removeLegacySdkSession(),
		]);
	} catch (error) {
		logger.error('Failed to clear auth storage:', error);
	}
}

export const storedSession = { load, save, clear };
