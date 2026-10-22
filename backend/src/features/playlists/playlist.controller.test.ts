import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import * as controller from '@/features/playlists/playlist.controller.js';
import { mockResponse } from '@/test/mock-response.js';

const svc = vi.hoisted(() => ({
	getPlaylistById: vi.fn(),
	createPlaylist: vi.fn(),
	getUserPlaylists: vi.fn(),
	getPublicPlaylists: vi.fn(),
	getPlaylistsByUser: vi.fn(),
	updatePlaylist: vi.fn(),
	deletePlaylist: vi.fn(),
}));

vi.mock('@/features/playlists/services/playlist.service.js', () => ({
	getPlaylistById: svc.getPlaylistById,
	createPlaylist: svc.createPlaylist,
}));
vi.mock('@/features/playlists/services/playlist-listing.service.js', () => ({
	getUserPlaylists: svc.getUserPlaylists,
	getPublicPlaylists: svc.getPublicPlaylists,
	getPlaylistsByUser: svc.getPlaylistsByUser,
}));
vi.mock('@/features/playlists/services/playlist-update.service.js', () => ({
	updatePlaylist: svc.updatePlaylist,
	deletePlaylist: svc.deletePlaylist,
}));

const USER = 'user-1';

function request(fields: Record<string, unknown> = {}): Request {
	return { user: { id: USER }, params: {}, body: {}, ...fields } as unknown as Request;
}

async function call(
	handler: (req: Request, res: Response) => Promise<void>,
	fields?: Record<string, unknown>
) {
	const res = mockResponse();
	await handler(request(fields), res as unknown as Response);
	return res;
}

beforeEach(() => {
	for (const fn of Object.values(svc)) fn.mockReset();
});

describe('playlist.controller', () => {
	it.each([
		['getUserPlaylists', svc.getUserPlaylists, controller.getUserPlaylists, [USER]],
		['getPublicPlaylists', svc.getPublicPlaylists, controller.getPublicPlaylists, [USER]],
	] as const)('%s answers the playlists of the service', async (_, fn, handler, args) => {
		fn.mockResolvedValue([{ id: 'p1' }]);

		const res = await call(handler);

		expect(fn).toHaveBeenCalledWith(...args);
		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({ success: true, data: { playlists: [{ id: 'p1' }] } });
	});

	it('getPlaylistsByUser passes the target user and the caller', async () => {
		svc.getPlaylistsByUser.mockResolvedValue([]);

		const res = await call(controller.getPlaylistsByUser, { params: { userId: 'target' } });

		expect(svc.getPlaylistsByUser).toHaveBeenCalledWith('target', USER);
		expect(res.body).toMatchObject({ data: { playlists: [] } });
	});

	it('createPlaylist answers 201 with the defaults applied by the schema', async () => {
		svc.createPlaylist.mockResolvedValue({ id: 'p1' });

		const res = await call(controller.createPlaylist, { body: { name: 'Mix' } });

		expect(svc.createPlaylist).toHaveBeenCalledWith(USER, {
			name: 'Mix',
			visibility: 'public',
			editMode: 'open',
		});
		expect(res.statusCode).toBe(201);
		expect(res.body).toMatchObject({ data: { playlist: { id: 'p1' } } });
	});

	it('createPlaylist rejects an invalid body before the service', async () => {
		await expect(call(controller.createPlaylist, { body: { name: '' } })).rejects.toBeInstanceOf(
			ZodError
		);
		expect(svc.createPlaylist).not.toHaveBeenCalled();
	});

	it('getPlaylistById answers the playlist with its tracks', async () => {
		svc.getPlaylistById.mockResolvedValue({ id: 'p1', tracks: [] });

		const res = await call(controller.getPlaylistById, { params: { id: 'p1' } });

		expect(svc.getPlaylistById).toHaveBeenCalledWith('p1', USER);
		expect(res.body).toMatchObject({ data: { playlist: { id: 'p1', tracks: [] } } });
	});

	it('updatePlaylist passes the validated fields', async () => {
		svc.updatePlaylist.mockResolvedValue({ id: 'p1', name: 'New' });

		const res = await call(controller.updatePlaylist, {
			params: { id: 'p1' },
			body: { name: 'New' },
		});

		expect(svc.updatePlaylist).toHaveBeenCalledWith('p1', USER, { name: 'New' });
		expect(res.body).toMatchObject({ data: { playlist: { name: 'New' } } });
	});

	it('deletePlaylist answers its message', async () => {
		svc.deletePlaylist.mockResolvedValue(undefined);

		const res = await call(controller.deletePlaylist, { params: { id: 'p1' } });

		expect(svc.deletePlaylist).toHaveBeenCalledWith('p1', USER);
		expect(res.body).toMatchObject({ data: { message: 'Playlist deleted successfully' } });
	});

	it('lets a service error propagate to errorHandler', async () => {
		const error = new Error('boom');
		svc.getPlaylistById.mockRejectedValue(error);

		await expect(call(controller.getPlaylistById, { params: { id: 'p1' } })).rejects.toBe(error);
	});
});
