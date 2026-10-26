import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { geocodeAddress } from '@/features/events/events-geocode.controller.js';
import { mockResponse } from '@/test/mock-response.js';

const { lookup } = vi.hoisted(() => ({ lookup: vi.fn() }));

vi.mock('@/features/events/services/geocode.service.js', () => ({ geocodeAddress: lookup }));

async function call(query: object) {
	const res = mockResponse();
	await geocodeAddress({ query } as unknown as Request, res as unknown as Response);
	return res;
}

beforeEach(() => {
	lookup.mockReset();
});

describe('events-geocode.controller', () => {
	it('answers the place of the trimmed address', async () => {
		const place = { latitude: 48.9, longitude: 2.3, displayName: 'Paris' };
		lookup.mockResolvedValue(place);

		const res = await call({ q: ' 1 rue de Paris ' });

		expect(lookup).toHaveBeenCalledWith('1 rue de Paris');
		expect(res.body).toMatchObject({ success: true, data: { location: place } });
	});

	it('answers location null when nothing matches', async () => {
		lookup.mockResolvedValue(null);
		const res = await call({ q: 'nowhere' });
		expect(res.body).toMatchObject({ success: true, data: { location: null } });
	});

	it('refuses an empty address before any lookup', async () => {
		await expect(call({ q: '' })).rejects.toMatchObject({ name: 'ZodError' });
		expect(lookup).not.toHaveBeenCalled();
	});
});
