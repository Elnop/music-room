import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';

// Reads tables and a trigger created by backend/migrations (011) through the
// real supabase-js client, against the local Supabase stack.
describe('profile creation (migrations 001 + 011)', () => {
	let userId: string;

	beforeAll(async () => {
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email: `int-${randomUUID()}@example.com`,
			password: 'integration-test-password',
			email_confirm: true,
		});
		if (error) throw error;
		userId = data.user.id;

		const { error: profileError } = await supabaseAdmin
			.from('user_profiles')
			.insert({ id: userId, username: `int_${userId.slice(0, 8)}` });
		if (profileError) throw profileError;
	});

	afterAll(async () => {
		// Cascades to user_profiles, profile_privacy and music_preferences.
		if (userId) await supabaseAdmin.auth.admin.deleteUser(userId);
	});

	it('creates default privacy settings for a new profile', async () => {
		const { data, error } = await supabaseAdmin
			.from('profile_privacy')
			.select('email_visibility, bio_visibility, avatar_visibility, music_preferences_visibility')
			.eq('user_id', userId)
			.single();

		expect(error).toBeNull();
		expect(data).toEqual({
			email_visibility: 'private',
			bio_visibility: 'public',
			avatar_visibility: 'public',
			music_preferences_visibility: 'public',
		});
	});

	it('creates an empty music preferences row', async () => {
		const { data, error } = await supabaseAdmin
			.from('music_preferences')
			.select('user_id')
			.eq('user_id', userId)
			.single();

		expect(error).toBeNull();
		expect(data?.user_id).toBe(userId);
	});
});
