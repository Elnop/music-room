import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import * as recommendationsService from '@/features/profile/services/recommendations.service.js';
import type { MusicGenre } from '@/shared/music/genres.js';
import type { VisibilityLevel } from '@/features/profile/profile.types.js';

// Other test files share the database, so assertions only look at the profiles created here.

const tag = randomUUID().slice(0, 8);
const userIds: string[] = [];

async function createUser(
	name: string,
	genres: MusicGenre[],
	musicVisibility: VisibilityLevel = 'public'
): Promise<string> {
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email: `reco-${randomUUID()}@example.com`,
		password: 'integration-test-password',
		email_confirm: true,
	});
	if (error) throw error;
	const id = data.user.id;
	userIds.push(id);
	const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
		id,
		username: `r${tag}_${userIds.length}`,
		avatar_url: `https://cdn.zumik.test/${name}.png`,
	});
	if (profileError) throw profileError;
	const { error: genresError } = await supabaseAdmin
		.from('music_preferences')
		.upsert({ user_id: id, genres });
	if (genresError) throw genresError;
	const { error: privacyError } = await supabaseAdmin
		.from('profile_privacy')
		.upsert({ user_id: id, music_preferences_visibility: musicVisibility });
	if (privacyError) throw privacyError;
	return id;
}

const ids: Record<string, string> = {};

async function ownRecommendations(viewer: string, limit = 20) {
	const result = await recommendationsService.getRecommendations(viewer, limit);
	const created = new Set(userIds);
	return { ...result, profiles: result.profiles.filter(p => created.has(p.id)) };
}

beforeAll(async () => {
	ids.viewer = await createUser('viewer', ['pop', 'rock', 'jazz']);
	ids.same = await createUser('same', ['jazz', 'pop', 'rock']);
	ids.two = await createUser('two', ['pop', 'rock']);
	ids.wideTwo = await createUser('wide_two', ['pop', 'rock', 'metal', 'latin', 'country']);
	ids.one = await createUser('one', ['pop']);
	ids.friendsOnly = await createUser('friends_only', ['pop', 'rock', 'jazz'], 'friends_only');
	ids.private = await createUser('private', ['pop', 'rock', 'jazz'], 'private');
	ids.followed = await createUser('followed', ['pop', 'rock', 'jazz']);
	ids.unrelated = await createUser('unrelated', ['metal']);
	ids.noTaste = await createUser('no_taste', []);
	const { error } = await supabaseAdmin
		.from('follows')
		.insert({ follower_id: ids.viewer, following_id: ids.followed });
	if (error) throw error;
	const { error: avatarError } = await supabaseAdmin
		.from('profile_privacy')
		.update({ avatar_visibility: 'private' })
		.eq('user_id', ids.two);
	if (avatarError) throw avatarError;
});

afterAll(async () => {
	for (const id of userIds) await supabaseAdmin.auth.admin.deleteUser(id);
});

describe('recommendationsService.getRecommendations', () => {
	it('ranks by Jaccard similarity, then by the number of shared genres', async () => {
		const { hasPreferences, profiles } = await ownRecommendations(ids.viewer);
		expect(hasPreferences).toBe(true);
		expect(profiles.map(p => p.id)).toEqual([ids.same, ids.two, ids.wideTwo, ids.one]);
		[1, 2 / 3, 1 / 3, 1 / 3].forEach((score, i) => expect(profiles[i].score).toBeCloseTo(score));
		expect(profiles[1].commonGenres).toEqual(['pop', 'rock']);
	});

	it('never suggests friends-only or private tastes, followed profiles, unrelated tastes or the viewer', async () => {
		const suggested = (await ownRecommendations(ids.viewer)).profiles.map(p => p.id);
		for (const excluded of [
			'friendsOnly',
			'private',
			'followed',
			'unrelated',
			'viewer',
			'noTaste',
		]) {
			expect(suggested).not.toContain(ids[excluded]);
		}
	});

	it("applies each profile's avatar privacy", async () => {
		const { profiles } = await ownRecommendations(ids.viewer);
		expect(profiles.find(p => p.id === ids.two)?.avatarUrl).toBeUndefined();
		expect(profiles.find(p => p.id === ids.same)?.avatarUrl).toBe(
			'https://cdn.zumik.test/same.png'
		);
	});

	it('returns hasPreferences false and no profile when the viewer has no genre', async () => {
		await expect(recommendationsService.getRecommendations(ids.noTaste, 10)).resolves.toEqual({
			hasPreferences: false,
			profiles: [],
		});
	});

	it('respects the limit', async () => {
		const { profiles } = await recommendationsService.getRecommendations(ids.viewer, 1);
		expect(profiles).toHaveLength(1);
	});
});
