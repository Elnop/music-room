import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { PrivacyService } from '@/features/profile/services/privacy.service.js';

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

// getFilteredProfile hides fields by visibility and friendship (threat model L9,
// #206), against profiles, privacy rows and follows in the local Supabase stack.
describe('PrivacyService.getFilteredProfile', () => {
	const privacy = new PrivacyService();
	const userIds: string[] = [];
	const emails = new Map<string, string>();
	let target: string;
	let stranger: string;
	let friend: string;
	let oneWay: string;

	async function createProfile(label: string): Promise<string> {
		const email = `int-privacy-${label}-${randomUUID()}@example.com`;
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: 'integration-test-password',
			email_confirm: true,
		});
		if (error) throw error;
		const id = data.user.id;
		userIds.push(id);
		emails.set(id, email);

		const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
			id,
			username: `int_${id.slice(0, 8)}`,
			display_name: `Int ${label}`,
			bio: `${label} bio`,
			avatar_url: `https://example.com/${label}.png`,
			favorite_artist: `${label} artist`,
		});
		if (profileError) throw profileError;
		return id;
	}

	beforeAll(async () => {
		target = await createProfile('target');
		stranger = await createProfile('stranger');
		friend = await createProfile('friend');
		oneWay = await createProfile('oneway');

		// Rows created by the migration 011 trigger on profile insert.
		const { error: privacyError } = await supabaseAdmin
			.from('profile_privacy')
			.update({
				bio_visibility: 'friends_only',
				avatar_visibility: 'private',
				email_visibility: 'private',
				music_preferences_visibility: 'public',
			})
			.eq('user_id', target);
		if (privacyError) throw privacyError;

		const { error: musicError } = await supabaseAdmin
			.from('music_preferences')
			.update({ genres: ['rock', 'jazz'] })
			.eq('user_id', target);
		if (musicError) throw musicError;

		const { error: followError } = await supabaseAdmin.from('follows').insert([
			{ follower_id: friend, following_id: target },
			{ follower_id: target, following_id: friend },
			{ follower_id: oneWay, following_id: target },
		]);
		if (followError) throw followError;
	});

	afterAll(async () => {
		// Cascades to user_profiles, profile_privacy, music_preferences and follows.
		for (const id of userIds) await supabaseAdmin.auth.admin.deleteUser(id);
	});

	it('shows a stranger only the public fields', async () => {
		const profile = await privacy.getFilteredProfile(stranger, target);

		expect(profile).toMatchObject({ id: target, isOwnProfile: false, isFriend: false });
		expect(profile).not.toHaveProperty('bio');
		expect(profile).not.toHaveProperty('avatarUrl');
		expect(profile).not.toHaveProperty('email');
		expect(profile.musicPreferences).toEqual(['rock', 'jazz']);
	});

	it('shows a mutual follower the friends_only fields but not the private ones', async () => {
		const profile = await privacy.getFilteredProfile(friend, target);

		expect(profile).toMatchObject({ isOwnProfile: false, isFriend: true, bio: 'target bio' });
		expect(profile).not.toHaveProperty('avatarUrl');
		expect(profile).not.toHaveProperty('email');
		expect(profile.musicPreferences).toEqual(['rock', 'jazz']);
	});

	it('treats a one-way follower as a stranger', async () => {
		const profile = await privacy.getFilteredProfile(oneWay, target);

		expect(profile.isFriend).toBe(false);
		expect(profile).not.toHaveProperty('bio');
		expect(profile).not.toHaveProperty('avatarUrl');
		expect(profile).not.toHaveProperty('email');
	});

	it('shows the owner every field, email included', async () => {
		const profile = await privacy.getFilteredProfile(target, target);

		expect(profile).toMatchObject({
			isOwnProfile: true,
			bio: 'target bio',
			avatarUrl: 'https://example.com/target.png',
			email: emails.get(target),
			musicPreferences: ['rock', 'jazz'],
		});
	});
});
