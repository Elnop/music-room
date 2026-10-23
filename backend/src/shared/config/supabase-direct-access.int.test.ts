import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from '@/shared/config/env.js';
import { createSignInClient, supabaseAdmin, supabaseAnon } from '@/shared/config/supabase.js';
import type { Database } from '@/shared/types/supabase.generated.js';

// The anon key ships in the app: neither it nor a user's token may read or write
// the public tables directly through PostgREST; only the backend's service key does.

const TABLES = ['user_profiles', 'follows', 'tracks', 'music_preferences', 'playlists'] as const;
const PASSWORD = 'integration-test-password';

describe('no direct table access with the anon key (#201)', () => {
	let userId: string;
	let targetId: string;
	let signedIn: typeof supabaseAnon;

	beforeAll(async () => {
		const email = `int-${randomUUID()}@example.com`;
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: PASSWORD,
			email_confirm: true,
		});
		if (error) throw error;
		userId = data.user.id;
		const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
			id: userId,
			username: `int_${userId.slice(0, 8)}`,
			email_verified: false,
			password_reset_code: '123456',
		});
		if (profileError) throw profileError;

		// A real user to follow, so a granted insert would really succeed.
		const { data: target, error: targetError } = await supabaseAdmin.auth.admin.createUser({
			email: `int-${randomUUID()}@example.com`,
			password: PASSWORD,
			email_confirm: true,
		});
		if (targetError) throw targetError;
		targetId = target.user.id;
		const { error: targetProfileError } = await supabaseAdmin
			.from('user_profiles')
			.insert({ id: targetId, username: `int_${targetId.slice(0, 8)}` });
		if (targetProfileError) throw targetProfileError;

		// Never sign in on the shared anon client: it would keep the session and the
		// "anonymous" queries below would run as this user.
		const { data: session, error: signInError } =
			await createSignInClient().auth.signInWithPassword({
				email,
				password: PASSWORD,
			});
		if (signInError) throw signInError;
		signedIn = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
			global: { headers: { Authorization: `Bearer ${session.session.access_token}` } },
			auth: { persistSession: false, autoRefreshToken: false },
		});
	});

	afterAll(async () => {
		if (userId) await supabaseAdmin.auth.admin.deleteUser(userId);
		if (targetId) await supabaseAdmin.auth.admin.deleteUser(targetId);
	});

	it.each(TABLES)('refuses an anonymous read of %s', async table => {
		const { data, error } = await supabaseAnon.from(table).select('*').limit(1);

		expect(data).toBeNull();
		expect(error?.code).toBe('42501'); // insufficient_privilege
	});

	it('refuses reading the reset and verification codes, even of the own row', async () => {
		const { error } = await signedIn
			.from('user_profiles')
			.select('password_reset_code, verification_code')
			.eq('id', userId);

		expect(error?.code).toBe('42501');
	});

	it('refuses marking the own email as verified', async () => {
		const { error } = await signedIn
			.from('user_profiles')
			.update({ email_verified: true })
			.eq('id', userId);
		expect(error?.code).toBe('42501');

		const { data } = await supabaseAdmin
			.from('user_profiles')
			.select('email_verified')
			.eq('id', userId)
			.single();
		expect(data?.email_verified).toBe(false);
	});

	it('refuses granting oneself music control through follows', async () => {
		const { error } = await signedIn
			.from('follows')
			.insert({ follower_id: userId, following_id: targetId, can_control_music: true });

		expect(error?.code).toBe('42501');
		const { count } = await supabaseAdmin
			.from('follows')
			.select('*', { count: 'exact', head: true })
			.eq('follower_id', userId);
		expect(count).toBe(0);
	});

	it('refuses writing tracks anonymously', async () => {
		const { error } = await supabaseAnon.from('tracks').delete().neq('id', randomUUID());

		expect(error?.code).toBe('42501');
	});

	it('still lets the backend service key read the profile', async () => {
		const { data, error } = await supabaseAdmin
			.from('user_profiles')
			.select('id, password_reset_code')
			.eq('id', userId)
			.single();

		expect(error).toBeNull();
		expect(data).toEqual({ id: userId, password_reset_code: '123456' });
	});
});
