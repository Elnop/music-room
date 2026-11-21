import type { UserProfile } from '@/shared/users/userTypes';
import { getAuthSession } from '@/shared/backend/lib/authSession';

export async function logout(): Promise<void> {
	await getAuthSession()?.logout?.();
}

export async function setAvatarUrl(url: string | null): Promise<void> {
	await getAuthSession()?.setAvatarUrl?.(url);
}

export async function setUser(user: UserProfile): Promise<void> {
	await getAuthSession()?.setUser?.(user);
}
