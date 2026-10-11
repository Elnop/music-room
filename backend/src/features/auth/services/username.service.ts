import { supabase } from '@/shared/config/supabase.js';
import { USERNAME_MIN_LENGTH, usernameBase, withSuffix } from '@/features/auth/utils/username.js';

async function isTaken(username: string): Promise<boolean> {
	const { data } = await supabase
		.from('user_profiles')
		.select('username')
		.eq('username', username)
		.single();
	return Boolean(data);
}

/**
 * Generate unique username from base name
 * @param baseName - Base name to generate username from (e.g., "John Doe")
 * @returns Unique username (e.g., "johndoe" or "johndoe1"), at most
 * USERNAME_MAX_LENGTH characters: the base is cut to leave room for a suffix
 */
export async function generateUniqueUsername(baseName: string): Promise<string> {
	let username = usernameBase(baseName);

	if (username.length < USERNAME_MIN_LENGTH) {
		username = `user${Date.now()}`;
	}

	if (!(await isTaken(username))) {
		return username;
	}

	for (let i = 1; i <= 999; i++) {
		const candidate = withSuffix(username, String(i));
		if (!(await isTaken(candidate))) {
			return candidate;
		}
	}

	return withSuffix(username, String(Date.now()));
}
