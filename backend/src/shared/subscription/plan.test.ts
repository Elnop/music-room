import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assertPremium, getPlan } from '@/shared/subscription/plan.js';

type Result = { data: unknown; error: { code?: string; message: string } | null };

const m = vi.hoisted(() => {
	const state: { result: Result } = { result: { data: null, error: null } };
	const from = vi.fn(() => {
		const builder: Record<string, unknown> = {};
		for (const step of ['select', 'eq']) builder[step] = () => builder;
		builder.single = () => Promise.resolve(state.result);
		return builder;
	});
	return { state, from };
});

vi.mock('@/shared/config/supabase.js', () => ({ supabaseAdmin: { from: m.from } }));
vi.mock('@/shared/utils/logger.js', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const planRow = (plan: string): Result => ({ data: { plan }, error: null });

beforeEach(() => {
	m.state.result = planRow('free');
});

describe('getPlan', () => {
	it('reads the plan from user_profiles', async () => {
		m.state.result = planRow('premium');
		await expect(getPlan('u1')).resolves.toBe('premium');
		expect(m.from).toHaveBeenCalledWith('user_profiles');
	});

	it('answers 404 USER_NOT_FOUND without a profile row', async () => {
		m.state.result = { data: null, error: { code: 'PGRST116', message: 'No rows' } };
		await expect(getPlan('u1')).rejects.toMatchObject({ statusCode: 404, code: 'USER_NOT_FOUND' });
	});

	it('answers 500 on a database error', async () => {
		m.state.result = { data: null, error: { message: 'boom' } };
		await expect(getPlan('u1')).rejects.toMatchObject({
			statusCode: 500,
			code: 'SUBSCRIPTION_FETCH_ERROR',
		});
	});
});

describe('assertPremium', () => {
	it('lets a premium user through', async () => {
		m.state.result = planRow('premium');
		await expect(assertPremium('u1')).resolves.toBeUndefined();
	});

	it('throws 403 PREMIUM_REQUIRED for a free user', async () => {
		await expect(assertPremium('u1')).rejects.toMatchObject({
			statusCode: 403,
			code: 'PREMIUM_REQUIRED',
		});
	});
});
