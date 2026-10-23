import { describe, expect, it } from 'vitest';
import type { Session, User } from '@supabase/supabase-js';
import {
	formatAuthResponse,
	providerIdField,
	toSessionBody,
	toUserProfile,
} from '@/features/auth/utils/auth.helpers.js';

const row = {
	id: 'user-a',
	username: 'alice',
	display_name: null,
	avatar_url: 'https://example.com/a.png',
	bio: null,
	created_at: '2025-01-01T00:00:00Z',
	updated_at: null,
};

const session = {
	access_token: 'access',
	refresh_token: 'refresh',
	expires_in: 0,
	expires_at: undefined,
} as unknown as Session;

describe('auth.helpers', () => {
	it('providerIdField names the column of the provider', () => {
		expect(providerIdField('google', 'g-1')).toEqual({ google_id: 'g-1' });
		expect(providerIdField('facebook', null)).toEqual({ facebook_id: null });
	});

	it('toUserProfile maps null columns to undefined and fills missing dates', () => {
		const profile = toUserProfile(row, 'a@example.com');

		expect(profile).toMatchObject({
			id: 'user-a',
			email: 'a@example.com',
			username: 'alice',
			avatarUrl: 'https://example.com/a.png',
			createdAt: '2025-01-01T00:00:00Z',
		});
		expect(profile.displayName).toBeUndefined();
		expect(profile.bio).toBeUndefined();
		expect(typeof profile.updatedAt).toBe('string');
	});

	it('toSessionBody defaults a missing lifetime to one hour', () => {
		expect(toSessionBody(session)).toEqual({
			accessToken: 'access',
			refreshToken: 'refresh',
			expiresIn: 3600,
			expiresAt: 0,
		});
	});

	it('formatAuthResponse keeps a zero lifetime as is', () => {
		const user = { id: 'user-a', email: undefined } as unknown as User;

		const response = formatAuthResponse(user, session, 'alice');

		expect(response.user).toMatchObject({ id: 'user-a', email: '', username: 'alice' });
		expect(response.session).toMatchObject({ expiresIn: 0, expiresAt: 0 });
	});
});
