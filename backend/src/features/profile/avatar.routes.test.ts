import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express, { type NextFunction, type Request, type Response } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import profileRoutes from '@/features/profile/profile.routes.js';
import { errorHandler } from '@/shared/middleware/error-handler.js';
import { ownedAvatarPath } from '@/features/profile/services/avatar.service.js';

/**
 * PUT and DELETE /api/profile/avatar (#351) with the real router, multer,
 * controllers and avatar.service. Supabase (the `user_profiles` row and the
 * `avatars` bucket), the auth middleware, the rate limiter and the logger are
 * faked. The limiter's 429 and the real Storage are covered by avatar.int.test.ts.
 */

const ME = '0b5c6d7e-1111-4222-8333-444455556666';
const OTHER = '9f8e7d6c-1111-4222-8333-444455556666';
const PUBLIC_BASE = 'http://supabase.test.invalid/storage/v1/object/public/avatars/';
const OLD_NAME = '3f2a1b0c-aaaa-4bbb-8ccc-ddddeeeeffff.jpg';

const sb = vi.hoisted(() => {
	const state = {
		avatarUrl: null as string | null,
		updateError: null as { message: string } | null,
		uploadError: null as { message: string } | null,
	};
	const updates: unknown[] = [];
	const upload = vi.fn((_path: string, _file: Buffer, _options: unknown) =>
		Promise.resolve({ data: {}, error: state.uploadError })
	);
	const remove = vi.fn((_paths: string[]) => Promise.resolve({ data: [], error: null }));
	const getPublicUrl = vi.fn((path: string) => ({
		data: { publicUrl: `http://supabase.test.invalid/storage/v1/object/public/avatars/${path}` },
	}));

	const from = vi.fn((_table: string) => {
		const query = {
			select: () => query,
			eq: () => query,
			single: () => Promise.resolve({ data: { avatar_url: state.avatarUrl }, error: null }),
			update: (values: unknown) => {
				updates.push(values);
				return {
					eq: () => Promise.resolve({ data: null, error: state.updateError }),
				};
			},
		};
		return query;
	});
	const storage = { from: vi.fn(() => ({ upload, remove, getPublicUrl })) };

	return { state, updates, upload, remove, getPublicUrl, from, storage };
});

vi.mock('@/shared/config/supabase.js', () => {
	const client = { from: sb.from, storage: sb.storage };
	return { supabaseAdmin: client };
});

vi.mock('@/shared/utils/logger.js', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/features/auth/middleware/rate-limit.middleware.js', () => ({
	avatarRateLimiter: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

vi.mock('@/features/auth/auth.middleware.js', () => ({
	authMiddleware: (req: Request, res: Response, next: NextFunction) => {
		const id = req.header('x-test-user');
		if (!id) {
			res.status(401).json({ success: false, error: { code: 'NO_AUTH_HEADER' } });
			return;
		}
		(req as Request & { user: { id: string; email: string } }).user = {
			id,
			email: `${id}@zumik.test`,
		};
		next();
	},
}));

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(512, 1)]);

interface ApiBody {
	success: boolean;
	data?: { avatarUrl: string | null };
	error?: { code?: string };
}

let server: Server;
let baseUrl: string;

beforeAll(async () => {
	const app = express();
	app.use(express.json());
	app.use('/api/profile', profileRoutes);
	app.use(errorHandler);
	server = app.listen(0);
	await new Promise<void>(resolve => server.once('listening', () => resolve()));
	baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
	await new Promise<void>(resolve => server.close(() => resolve()));
});

beforeEach(() => {
	vi.clearAllMocks();
	sb.state.avatarUrl = null;
	sb.state.updateError = null;
	sb.state.uploadError = null;
	sb.updates.length = 0;
});

function photoForm(content: Buffer, type = 'image/jpeg', name = 'avatar.jpg'): FormData {
	const form = new FormData();
	form.append('avatar', new Blob([new Uint8Array(content)], { type }), name);
	return form;
}

async function call(
	method: 'PUT' | 'DELETE',
	body?: FormData,
	user: string | null = ME
): Promise<{ status: number; body: ApiBody }> {
	const res = await fetch(`${baseUrl}/api/profile/avatar`, {
		method,
		headers: user ? { 'x-test-user': user } : {},
		body,
	});
	return { status: res.status, body: (await res.json()) as ApiBody };
}

describe('ownedAvatarPath', () => {
	it('returns the object path of a photo stored in the user folder', () => {
		expect(ownedAvatarPath(`${PUBLIC_BASE}${ME}/${OLD_NAME}`, ME)).toBe(`${ME}/${OLD_NAME}`);
	});

	it('ignores external pictures (Google, Facebook) and missing URLs', () => {
		expect(ownedAvatarPath('https://lh3.googleusercontent.com/a/abc=s96-c', ME)).toBeNull();
		expect(ownedAvatarPath('https://platform-lookaside.fbsbx.com/x.jpg', ME)).toBeNull();
		expect(ownedAvatarPath(null, ME)).toBeNull();
		expect(ownedAvatarPath(undefined, ME)).toBeNull();
		expect(ownedAvatarPath('not a url', ME)).toBeNull();
	});

	it('returns null for a bad percent sequence instead of throwing', () => {
		expect(ownedAvatarPath(`${PUBLIC_BASE}${ME}/%E0%A4%A.jpg`, ME)).toBeNull();
		expect(ownedAvatarPath(`${PUBLIC_BASE}%`, ME)).toBeNull();
	});

	it("never returns a file of another user's folder", () => {
		expect(ownedAvatarPath(`${PUBLIC_BASE}${OTHER}/${OLD_NAME}`, ME)).toBeNull();
	});

	it('rejects paths that are not <userId>/<uuid>.<ext>', () => {
		expect(ownedAvatarPath(`${PUBLIC_BASE}${ME}/../${OTHER}/${OLD_NAME}`, ME)).toBeNull();
		expect(ownedAvatarPath(`${PUBLIC_BASE}${ME}/sub/${OLD_NAME}`, ME)).toBeNull();
		expect(ownedAvatarPath(`${PUBLIC_BASE}${ME}/avatar.gif`, ME)).toBeNull();
		expect(ownedAvatarPath(`${PUBLIC_BASE}${ME}`, ME)).toBeNull();
		expect(
			ownedAvatarPath(`http://x/storage/v1/object/public/other/${ME}/${OLD_NAME}`, ME)
		).toBeNull();
	});
});

describe('PUT /api/profile/avatar', () => {
	it('requires authentication', async () => {
		const res = await call('PUT', photoForm(JPEG), null);
		expect(res.status).toBe(401);
		expect(sb.upload).not.toHaveBeenCalled();
	});

	it('stores a JPEG under <userId>/<uuid>.jpg and saves its public URL', async () => {
		const res = await call('PUT', photoForm(JPEG));

		expect(res.status).toBe(200);
		expect(sb.upload).toHaveBeenCalledTimes(1);
		const [path, file, options] = sb.upload.mock.calls[0];
		expect(path).toMatch(new RegExp(`^${ME}/[0-9a-f-]{36}\\.jpg$`));
		expect(Buffer.compare(file, JPEG)).toBe(0);
		expect(options).toMatchObject({ contentType: 'image/jpeg', upsert: false });
		expect(res.body.data?.avatarUrl).toBe(`${PUBLIC_BASE}${path}`);
		expect(sb.updates[0]).toMatchObject({ avatar_url: `${PUBLIC_BASE}${path}` });
		expect(sb.remove).not.toHaveBeenCalled();
	});

	it('takes the type from the bytes, not from the declared MIME type', async () => {
		const png = Buffer.concat([
			Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
			Buffer.alloc(64),
		]);
		const res = await call('PUT', photoForm(png, 'image/jpeg', 'avatar.jpg'));

		expect(res.status).toBe(200);
		expect(sb.upload.mock.calls[0][0]).toMatch(/\.png$/);
		expect(sb.upload.mock.calls[0][2]).toMatchObject({ contentType: 'image/png' });
	});

	it('deletes the previous photo it stored', async () => {
		sb.state.avatarUrl = `${PUBLIC_BASE}${ME}/${OLD_NAME}`;

		const res = await call('PUT', photoForm(JPEG));

		expect(res.status).toBe(200);
		expect(sb.remove).toHaveBeenCalledWith([`${ME}/${OLD_NAME}`]);
	});

	it('leaves an external (Google) picture alone', async () => {
		sb.state.avatarUrl = 'https://lh3.googleusercontent.com/a/abc=s96-c';

		const res = await call('PUT', photoForm(JPEG));

		expect(res.status).toBe(200);
		expect(sb.remove).not.toHaveBeenCalled();
	});

	it('refuses a text file named .jpg with INVALID_IMAGE, storing nothing', async () => {
		const res = await call('PUT', photoForm(Buffer.from('not a photo'), 'image/jpeg', 'x.jpg'));

		expect(res.status).toBe(400);
		expect(res.body.error?.code).toBe('INVALID_IMAGE');
		expect(sb.upload).not.toHaveBeenCalled();
		expect(sb.updates).toHaveLength(0);
	});

	it('refuses a file over 2 MB with 413 FILE_TOO_LARGE, storing nothing', async () => {
		const big = Buffer.concat([JPEG, Buffer.alloc(3 * 1024 * 1024)]);
		const res = await call('PUT', photoForm(big));

		expect(res.status).toBe(413);
		expect(res.body.error?.code).toBe('FILE_TOO_LARGE');
		expect(sb.upload).not.toHaveBeenCalled();
	});

	it('answers 400 VALIDATION_ERROR without an avatar file', async () => {
		const res = await call('PUT', new FormData());

		expect(res.status).toBe(400);
		expect(res.body.error?.code).toBe('VALIDATION_ERROR');
		expect(sb.upload).not.toHaveBeenCalled();
	});

	it('answers 400 INVALID_UPLOAD for a file in another field', async () => {
		const form = new FormData();
		form.append('photo', new Blob([new Uint8Array(JPEG)], { type: 'image/jpeg' }), 'a.jpg');
		const res = await call('PUT', form);

		expect(res.status).toBe(400);
		expect(res.body.error?.code).toBe('INVALID_UPLOAD');
		expect(sb.upload).not.toHaveBeenCalled();
	});

	it('removes the new file when the profile cannot be saved', async () => {
		sb.state.avatarUrl = `${PUBLIC_BASE}${ME}/${OLD_NAME}`;
		sb.state.updateError = { message: 'db down' };

		const res = await call('PUT', photoForm(JPEG));

		expect(res.status).toBe(500);
		const newPath = sb.upload.mock.calls[0][0];
		expect(sb.remove).toHaveBeenCalledTimes(1);
		expect(sb.remove).toHaveBeenCalledWith([newPath]);
	});

	it('answers 500 when Storage refuses the file, saving nothing', async () => {
		sb.state.uploadError = { message: 'bucket not found' };

		const res = await call('PUT', photoForm(JPEG));

		expect(res.status).toBe(500);
		expect(res.body.error?.code).toBe('AVATAR_UPLOAD_ERROR');
		expect(sb.updates).toHaveLength(0);
	});
});

describe('DELETE /api/profile/avatar', () => {
	it('requires authentication', async () => {
		const res = await call('DELETE', undefined, null);
		expect(res.status).toBe(401);
	});

	it('clears avatar_url and deletes the stored photo', async () => {
		sb.state.avatarUrl = `${PUBLIC_BASE}${ME}/${OLD_NAME}`;

		const res = await call('DELETE');

		expect(res.status).toBe(200);
		expect(res.body.data).toEqual({ avatarUrl: null });
		expect(sb.updates[0]).toMatchObject({ avatar_url: null });
		expect(sb.remove).toHaveBeenCalledWith([`${ME}/${OLD_NAME}`]);
	});

	it('clears an external picture without touching Storage', async () => {
		sb.state.avatarUrl = 'https://lh3.googleusercontent.com/a/abc=s96-c';

		const res = await call('DELETE');

		expect(res.status).toBe(200);
		expect(sb.updates[0]).toMatchObject({ avatar_url: null });
		expect(sb.remove).not.toHaveBeenCalled();
	});
});
