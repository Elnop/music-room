import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import * as controller from '@/features/playlists/playlist-tracks.controller.js';
import { mockResponse } from '@/test/mock-response.js';

const svc = vi.hoisted(() => ({ addTrack: vi.fn(), removeTrack: vi.fn(), moveTrack: vi.fn() }));
vi.mock('@/features/playlists/services/playlist-track.service.js', () => svc);

const USER = 'user-1';
const TRACK = '6f1c2b8e-2a4d-4c7e-9a1b-3d5e7f9a1b2c';

async function call(
	handler: (req: Request, res: Response) => Promise<void>,
	fields: Record<string, unknown>
) {
	const res = mockResponse();
	const req = { user: { id: USER }, body: {}, ...fields } as unknown as Request;
	await handler(req, res as unknown as Response);
	return res;
}

beforeEach(() => {
	for (const fn of Object.values(svc)) fn.mockReset();
});

describe('playlist-tracks.controller', () => {
	it('addTrack answers 201 with the result, empty URLs turned into undefined', async () => {
		svc.addTrack.mockResolvedValue({ tracksVersion: 1 });
		const body = {
			trackUri: 'https://soundcloud.com/a/b',
			title: 'T',
			artist: 'A',
			albumArt: '',
			durationMs: 1000,
		};

		const res = await call(controller.addTrack, { params: { id: 'p1' }, body });

		expect(svc.addTrack).toHaveBeenCalledWith('p1', USER, {
			trackUri: 'https://soundcloud.com/a/b',
			title: 'T',
			artist: 'A',
			album: undefined,
			albumArt: undefined,
			durationMs: 1000,
			previewUrl: undefined,
		});
		expect(res.statusCode).toBe(201);
		expect(res.body).toMatchObject({ success: true, data: { tracksVersion: 1 } });
	});

	it('removeTrack answers the new version', async () => {
		svc.removeTrack.mockResolvedValue({ tracksVersion: 2 });

		const res = await call(controller.removeTrack, { params: { id: 'p1', trackId: TRACK } });

		expect(svc.removeTrack).toHaveBeenCalledWith('p1', USER, TRACK);
		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({ data: { tracksVersion: 2 } });
	});

	it('removeTrack rejects a track id that is not a uuid', async () => {
		await expect(
			call(controller.removeTrack, { params: { id: 'p1', trackId: 'nope' } })
		).rejects.toBeInstanceOf(ZodError);
		expect(svc.removeTrack).not.toHaveBeenCalled();
	});

	it('moveTrack passes the target rank and the expected version', async () => {
		svc.moveTrack.mockResolvedValue({ trackId: TRACK, rank: 'h' });
		const move = { afterRank: null, expectedVersion: 3 };

		const res = await call(controller.moveTrack, {
			params: { id: 'p1', trackId: TRACK },
			body: move,
		});

		expect(svc.moveTrack).toHaveBeenCalledWith('p1', USER, TRACK, move);
		expect(res.body).toMatchObject({ data: { trackId: TRACK, rank: 'h' } });
	});
});
