import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import * as controller from '@/features/queue/queue.controller.js';
import { mockResponse } from '@/test/mock-response.js';

const svc = vi.hoisted(() => ({
	getQueue: vi.fn(),
	addItem: vi.fn(),
	removeItem: vi.fn(),
	moveItem: vi.fn(),
	playItem: vi.fn(),
	playPlaylist: vi.fn(),
	step: vi.fn(),
	transfer: vi.fn(),
}));
vi.mock('@/features/queue/services/queue.service.js', () => ({
	getQueue: svc.getQueue,
	addItem: svc.addItem,
	removeItem: svc.removeItem,
	moveItem: svc.moveItem,
	playItem: svc.playItem,
	playPlaylist: svc.playPlaylist,
	step: svc.step,
}));
vi.mock('@/features/queue/services/queue-transfer.service.js', () => ({
	transfer: svc.transfer,
}));

const ME = '11111111-1111-4111-8111-111111111111';
const OWNER = '22222222-2222-4222-8222-222222222222';
const ITEM = '33333333-3333-4333-8333-333333333333';
const AFTER = '44444444-4444-4444-8444-444444444444';
const PLAYLIST = '55555555-5555-4555-8555-555555555555';
const STATE = { ownerId: ME, version: 3, currentItemId: null, items: [] };
const track = { trackUri: 'https://soundcloud.com/a/t', title: 'T', artist: 'A', durationMs: 1 };

async function call(
	handler: (req: Request, res: Response) => Promise<void>,
	fields: Record<string, unknown> = {}
) {
	const res = mockResponse();
	const req = { user: { id: ME }, params: {}, body: undefined, ...fields } as unknown as Request;
	await handler(req, res as unknown as Response);
	return res;
}

beforeEach(() => {
	for (const fn of Object.values(svc)) fn.mockReset().mockResolvedValue(STATE);
});

describe('queue.controller', () => {
	it('getQueue answers 200 with the caller queue', async () => {
		const res = await call(controller.getQueue);

		expect(svc.getQueue).toHaveBeenCalledWith(ME, ME);
		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({ success: true, data: STATE });
	});

	it("acts on :userId's queue when mounted under /api/users/:userId/queue", async () => {
		await call(controller.getQueue, { params: { userId: OWNER } });

		expect(svc.getQueue).toHaveBeenCalledWith(ME, OWNER);
	});

	it('rejects a :userId that is not a uuid', async () => {
		await expect(call(controller.getQueue, { params: { userId: 'x' } })).rejects.toBeInstanceOf(
			ZodError
		);
		expect(svc.getQueue).not.toHaveBeenCalled();
	});

	it('addItem splits `next` from the track and strips previewUrl', async () => {
		await call(controller.addItem, {
			body: { ...track, previewUrl: 'https://stream', next: true },
		});

		expect(svc.addItem).toHaveBeenCalledWith(ME, ME, track, { next: true });
	});

	it('addItem rejects a body without a track', async () => {
		await expect(call(controller.addItem, { body: {} })).rejects.toBeInstanceOf(ZodError);
		expect(svc.addItem).not.toHaveBeenCalled();
	});

	it('removeItem passes the item id', async () => {
		await call(controller.removeItem, { params: { itemId: ITEM } });

		expect(svc.removeItem).toHaveBeenCalledWith(ME, ME, ITEM);
	});

	it('moveItem passes the item and the one it goes after', async () => {
		await call(controller.moveItem, { params: { itemId: ITEM }, body: { afterItemId: AFTER } });

		expect(svc.moveItem).toHaveBeenCalledWith(ME, ME, ITEM, AFTER);
	});

	it('playItem accepts no body and passes the device when sent', async () => {
		await call(controller.playItem, { params: { itemId: ITEM } });
		await call(controller.playItem, { params: { itemId: ITEM }, body: { deviceId: 'tv' } });

		expect(svc.playItem).toHaveBeenNthCalledWith(1, ME, ME, ITEM, undefined);
		expect(svc.playItem).toHaveBeenNthCalledWith(2, ME, ME, ITEM, 'tv');
	});

	it('playPlaylist passes the playlist and the device', async () => {
		await call(controller.playPlaylist, {
			params: { playlistId: PLAYLIST, userId: OWNER },
			body: { deviceId: 'tv' },
		});

		expect(svc.playPlaylist).toHaveBeenCalledWith(ME, OWNER, PLAYLIST, 'tv');
	});

	it.each([
		['stepNext', controller.stepNext, 'next'],
		['stepPrevious', controller.stepPrevious, 'previous'],
	] as const)('%s steps %s', async (_, handler, direction) => {
		const res = await call(handler, { body: { deviceId: 'tv' } });

		expect(svc.step).toHaveBeenCalledWith(ME, ME, direction, 'tv');
		expect(res.body).toMatchObject({ data: STATE });
	});

	it('transfer answers the transfer result of the caller', async () => {
		const result = { ownerId: OWNER, deviceId: 'tv', queue: null };
		svc.transfer.mockResolvedValue(result);
		const body = { targetUserId: OWNER, targetDeviceId: 'tv', positionMs: 0, playing: { track } };

		const res = await call(controller.transfer, { body });

		expect(svc.transfer).toHaveBeenCalledWith(ME, body);
		expect(res.statusCode).toBe(200);
		expect(res.body).toMatchObject({ success: true, data: result });
	});

	it('transfer rejects an invalid body', async () => {
		await expect(call(controller.transfer, { body: {} })).rejects.toBeInstanceOf(ZodError);
		expect(svc.transfer).not.toHaveBeenCalled();
	});
});
