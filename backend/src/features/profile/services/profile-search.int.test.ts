import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { ProfileService } from '@/features/profile/services/profile.service.js';

// searchUsers against the local stack: the query is matched literally, never
// read as PostgREST filter syntax (#236).

const service = new ProfileService();
const tag = randomUUID().slice(0, 8);
const userIds: string[] = [];
let targetId: string;
let otherId: string;

async function createUser(username: string): Promise<string> {
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email: `search-${randomUUID()}@example.com`,
		password: 'integration-test-password',
		email_confirm: true,
	});
	if (error) throw error;
	userIds.push(data.user.id);
	const { error: profileError } = await supabaseAdmin
		.from('user_profiles')
		.insert({ id: data.user.id, username });
	if (profileError) throw profileError;
	return data.user.id;
}

beforeAll(async () => {
	targetId = await createUser(`s${tag}_50%_off`);
	otherId = await createUser(`s${tag}_plain`);
});

afterAll(async () => {
	for (const id of userIds) await supabaseAdmin.auth.admin.deleteUser(id);
});

describe('ProfileService.searchUsers (#236)', () => {
	it('finds users whose name contains the query', async () => {
		const ids = (await service.searchUsers(`s${tag}`)).map(p => p.id);
		expect(ids).toEqual(expect.arrayContaining([targetId, otherId]));
	});

	it('does not let a comma add a filter condition', async () => {
		const results = await service.searchUsers(`zzz${tag},id.eq.${otherId}`);
		expect(results.map(p => p.id)).not.toContain(otherId);
	});

	it('answers without error for parentheses and quotes', async () => {
		await expect(service.searchUsers(`${tag})`)).resolves.toEqual([]);
		await expect(service.searchUsers(`${tag}"x`)).resolves.toEqual([]);
	});

	it('matches LIKE wildcards literally', async () => {
		const ids = (await service.searchUsers(`s${tag}_50%_off`)).map(p => p.id);
		expect(ids).toEqual([targetId]);
		expect(await service.searchUsers(`s${tag}%plain`)).toEqual([]);
		// * is not "anything": it stands for exactly one character
		expect(await service.searchUsers(`s${tag}*lain`)).toEqual([]);
	});
});
