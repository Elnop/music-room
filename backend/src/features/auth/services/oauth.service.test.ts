import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as oauthService from '@/features/auth/services/oauth.service.js';
import { AppError } from '@/shared/middleware/error-handler.js';

vi.mock('@/shared/utils/logger.js', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

const fetchMock = vi.fn<(url: string) => Promise<Response>>();

function graphReply(status: number, body: unknown): Response {
	return new Response(JSON.stringify(body), { status });
}

const EXPIRED = { error: { message: 'Session has expired', type: 'OAuthException', code: 190 } };
const profile = {
	id: 'fb-user-1',
	name: 'Ada',
	email: 'ada@example.com',
	picture: { data: { url: 'https://example.com/ada.jpg' } },
};

/** Routes Graph API calls by path: /app and /me. */
function graph(app: Response, me: Response = graphReply(200, profile)) {
	fetchMock.mockImplementation(url =>
		Promise.resolve(new URL(url).pathname.endsWith('/app') ? app : me)
	);
}

async function caught(promise: Promise<unknown>): Promise<AppError> {
	const error = await promise.then(
		() => {
			throw new Error('expected a rejection');
		},
		(reason: unknown) => reason
	);
	expect(error).toBeInstanceOf(AppError);
	return error as AppError;
}

describe('oauth.service verifyFacebookToken', () => {
	beforeEach(() => {
		fetchMock.mockReset();
		vi.stubGlobal('fetch', fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns the profile of a token issued for this app', async () => {
		graph(graphReply(200, { id: 'test-facebook-app-id', name: 'Zumik' }));

		await expect(oauthService.verifyFacebookToken('user-token')).resolves.toEqual({
			id: 'fb-user-1',
			name: 'Ada',
			email: 'ada@example.com',
			picture: 'https://example.com/ada.jpg',
		});
	});

	it('never sends an app secret, only the user token', async () => {
		graph(graphReply(200, { id: 'test-facebook-app-id' }));

		await oauthService.verifyFacebookToken('user-token');

		for (const [called] of fetchMock.mock.calls) {
			const url = new URL(called);
			expect(url.searchParams.get('access_token')).toBe('user-token');
			expect(url.searchParams.has('appsecret_proof')).toBe(false);
		}
	});

	it('rejects a token issued for another app', async () => {
		graph(graphReply(200, { id: 'other-app-id' }));

		const error = await caught(oauthService.verifyFacebookToken('user-token'));

		expect(error.statusCode).toBe(401);
		expect(error.code).toBe('INVALID_TOKEN');
	});

	it('rejects an expired or invalid token', async () => {
		graph(graphReply(400, EXPIRED));

		const error = await caught(oauthService.verifyFacebookToken('user-token'));

		expect(error.statusCode).toBe(401);
		expect(error.code).toBe('INVALID_FACEBOOK_TOKEN');
	});

	it('rejects when the profile cannot be read', async () => {
		graph(graphReply(200, { id: 'test-facebook-app-id' }), graphReply(400, EXPIRED));

		const error = await caught(oauthService.verifyFacebookToken('user-token'));

		expect(error.code).toBe('PROFILE_FETCH_ERROR');
	});

	it('maps a network failure to 401', async () => {
		fetchMock.mockRejectedValue(new TypeError('fetch failed'));

		const error = await caught(oauthService.verifyFacebookToken('user-token'));

		expect(error.statusCode).toBe(401);
		expect(error.code).toBe('INVALID_TOKEN');
	});
});
