import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import * as controller from '@/features/playlists/playlist-sharing.controller.js';
import { mockResponse } from '@/test/mock-response.js';

const svc = vi.hoisted(() => ({
	addCollaborator: vi.fn(),
	removeCollaborator: vi.fn(),
	addViewer: vi.fn(),
	removeViewer: vi.fn(),
	getViewers: vi.fn(),
}));
vi.mock('@/features/playlists/services/collaborator.service.js', () => ({
	addCollaborator: svc.addCollaborator,
	removeCollaborator: svc.removeCollaborator,
}));
vi.mock('@/features/playlists/services/viewer.service.js', () => ({
	addViewer: svc.addViewer,
	removeViewer: svc.removeViewer,
}));
vi.mock('@/features/playlists/services/viewer-list.service.js', () => ({
	getViewers: svc.getViewers,
}));

const OWNER = 'owner-1';
const MEMBER = '6f1c2b8e-2a4d-4c7e-9a1b-3d5e7f9a1b2c';

async function call(
	handler: (req: Request, res: Response) => Promise<void>,
	fields: Record<string, unknown>
) {
	const res = mockResponse();
	const req = { user: { id: OWNER }, body: {}, ...fields } as unknown as Request;
	await handler(req, res as unknown as Response);
	return res;
}

beforeEach(() => {
	for (const fn of Object.values(svc)) fn.mockReset();
});

describe('playlist-sharing.controller', () => {
	it.each([
		['addCollaborator', controller.addCollaborator, svc.addCollaborator, 'Collaborator added'],
		['addViewer', controller.addViewer, svc.addViewer, 'Viewer added'],
	] as const)('%s answers 201 with its message', async (_, handler, fn, message) => {
		fn.mockResolvedValue(undefined);

		const res = await call(handler, { params: { id: 'p1' }, body: { userId: MEMBER } });

		expect(fn).toHaveBeenCalledWith('p1', OWNER, MEMBER);
		expect(res.statusCode).toBe(201);
		expect(res.body).toMatchObject({ data: { message: `${message} successfully` } });
	});

	it.each([
		['removeCollaborator', controller.removeCollaborator, svc.removeCollaborator, 'Collaborator'],
		['removeViewer', controller.removeViewer, svc.removeViewer, 'Viewer'],
	] as const)('%s answers 200 with its message', async (_, handler, fn, who) => {
		fn.mockResolvedValue(undefined);

		const res = await call(handler, { params: { id: 'p1', userId: MEMBER } });

		expect(fn).toHaveBeenCalledWith('p1', OWNER, MEMBER);
		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({ data: { message: `${who} removed successfully` } });
	});

	it('addCollaborator rejects a user id that is not a uuid', async () => {
		await expect(
			call(controller.addCollaborator, { params: { id: 'p1' }, body: { userId: 'x' } })
		).rejects.toBeInstanceOf(ZodError);
		expect(svc.addCollaborator).not.toHaveBeenCalled();
	});

	it('getViewers answers the viewers of the playlist', async () => {
		svc.getViewers.mockResolvedValue([{ id: MEMBER, username: 'm' }]);

		const res = await call(controller.getViewers, { params: { id: 'p1' } });

		expect(svc.getViewers).toHaveBeenCalledWith('p1', OWNER);
		expect(res.body).toMatchObject({ data: { viewers: [{ id: MEMBER, username: 'm' }] } });
	});
});
