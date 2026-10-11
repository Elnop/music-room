import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { UserService } from '@/features/auth/services/user.service.js';

// A Google/Facebook name longer than user_profiles.username allows (20
// characters) still creates the account, against the local Supabase stack.

const createdUserIds: string[] = [];

async function createGoogleUser(name: string): Promise<string> {
	const { userProfile } = await UserService.createOAuthUser(
		'google',
		`google-${randomUUID()}`,
		`int-${randomUUID()}@example.com`,
		{ name }
	);
	createdUserIds.push(userProfile.id);
	return userProfile.username;
}

describe('OAuth username generation', () => {
	afterAll(async () => {
		for (const id of createdUserIds) {
			await supabaseAdmin.auth.admin.deleteUser(id);
		}
	});

	it('cuts a long name to 20 characters, and keeps the suffix of a taken one', async () => {
		// Unique per run: the integration database keeps rows between runs
		const name = `Longnamefortest ${randomUUID().replace(/-/g, '').slice(0, 10)}`;
		const base = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);

		const first = await createGoogleUser(name);
		const second = await createGoogleUser(name);

		expect(first).toBe(base);
		expect(second).toBe(`${base.slice(0, 19)}1`);
	});
});
