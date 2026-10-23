import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import * as oauthUserService from '@/features/auth/services/oauth-user.service.js';

// Migration 019 run again on rows from before has_password tracking, against the local Supabase stack.
// scripts/test-db.sh already applied it once on an empty database; it is safe to rerun.

// Database container started by scripts/test-db.sh (SUPABASE_PROJECT_ID there).
const DB_CONTAINER = 'supabase_db_music-room-test';
const MIGRATION = new URL(
	'../../../../migrations/019_oauth_has_password_backfill.sql',
	import.meta.url
);
// Before the migration's cutoff.
const BEFORE_189 = '2026-09-01 00:00:00+00';

const createdUserIds: string[] = [];

function psql(sql: string | Buffer): void {
	execFileSync(
		'docker',
		[
			'exec',
			'-i',
			DB_CONTAINER,
			'psql',
			'-U',
			'postgres',
			'-d',
			'postgres',
			'-v',
			'ON_ERROR_STOP=1',
			'-q',
		],
		{ input: sql }
	);
}

/** auth.users is not reachable through PostgREST. */
function backdate(id: string): void {
	psql(`UPDATE auth.users SET created_at = '${BEFORE_189}' WHERE id = '${id}';`);
}

async function updateProfile(
	id: string,
	values: { has_password?: boolean; google_id?: string | null }
): Promise<void> {
	const { error } = await supabaseAdmin.from('user_profiles').update(values).eq('id', id);
	if (error) throw error;
}

async function hasPassword(id: string): Promise<boolean | null> {
	const { data, error } = await supabaseAdmin
		.from('user_profiles')
		.select('has_password')
		.eq('id', id)
		.single();
	if (error) throw error;
	return data.has_password;
}

/** An email/password sign-up, as register creates it (no oauth_provider metadata). */
async function createPasswordUser(): Promise<string> {
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email: `int-${randomUUID()}@example.com`,
		password: 'integration-test-password',
		email_confirm: false,
	});
	if (error) throw error;
	const id = data.user.id;
	createdUserIds.push(id);
	const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
		id,
		username: `int_${id.slice(0, 8)}`,
		has_password: true,
		email_verified: true,
	});
	if (profileError) throw profileError;
	backdate(id);
	return id;
}

/** A Google or Facebook sign-up with has_password true. */
async function createOAuthUser(provider: 'google' | 'facebook'): Promise<string> {
	const { userProfile } = await oauthUserService.createOAuthUser(
		provider,
		`${provider}-${randomUUID()}`,
		`int-${randomUUID()}@example.com`,
		{ name: 'OAuth Only' }
	);
	createdUserIds.push(userProfile.id);
	await updateProfile(userProfile.id, { has_password: true });
	return userProfile.id;
}

describe('migration 019: has_password backfill (#196)', () => {
	afterAll(async () => {
		// Cascades to user_profiles.
		for (const id of createdUserIds) await supabaseAdmin.auth.admin.deleteUser(id);
	});

	it('sets false on Google and Facebook sign-ups made before #189', async () => {
		const google = await createOAuthUser('google');
		const facebook = await createOAuthUser('facebook');
		// Unlinked its only provider while has_password was wrongly true.
		const unlinked = await createOAuthUser('google');
		await updateProfile(unlinked, { google_id: null });
		for (const id of [google, facebook, unlinked]) backdate(id);

		psql(readFileSync(MIGRATION));

		expect(await hasPassword(google)).toBe(false);
		expect(await hasPassword(facebook)).toBe(false);
		expect(await hasPassword(unlinked)).toBe(false);
	});

	it('keeps password accounts and later sign-ups that set a password', async () => {
		const password = await createPasswordUser();
		// An email sign-up that linked Google afterwards.
		const linked = await createPasswordUser();
		await updateProfile(linked, { google_id: `google-${randomUUID()}` });
		// Signed up after the cutoff (has_password false), then set a password by reset.
		const resetAfter189 = await createOAuthUser('google');

		psql(readFileSync(MIGRATION));

		expect(await hasPassword(password)).toBe(true);
		expect(await hasPassword(linked)).toBe(true);
		expect(await hasPassword(resetAfter189)).toBe(true);
	});
});
