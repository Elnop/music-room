import { describe, expect, it } from 'vitest';
import {
	createEventSchema,
	geocodeQuerySchema,
	updateEventSchema,
} from '@/features/events/events.validators.js';

const hour = 3_600_000;
const iso = (offset: number) => new Date(Date.now() + offset).toISOString();
const valid = {
	name: 'Rooftop',
	address: '1 rue de Paris',
	latitude: 48.9,
	longitude: 2.3,
	genres: ['rock'],
	startsAt: iso(hour),
	endsAt: iso(3 * hour),
};

describe('createEventSchema', () => {
	it('accepts an upcoming event', () => {
		expect(createEventSchema.safeParse(valid).success).toBe(true);
	});

	it('refuses an end before the start', () => {
		const result = createEventSchema.safeParse({ ...valid, endsAt: iso(hour / 2) });
		expect(result.success).toBe(false);
	});

	it('refuses an event that is already over', () => {
		const result = createEventSchema.safeParse({
			...valid,
			startsAt: iso(-3 * hour),
			endsAt: iso(-hour),
		});
		expect(result.success).toBe(false);
	});

	it('refuses an unknown genre, no genre and an out-of-range latitude', () => {
		expect(createEventSchema.safeParse({ ...valid, genres: ['polka'] }).success).toBe(false);
		expect(createEventSchema.safeParse({ ...valid, genres: [] }).success).toBe(false);
		expect(createEventSchema.safeParse({ ...valid, latitude: 91 }).success).toBe(false);
	});
});

describe('updateEventSchema', () => {
	it('accepts a partial update and null to clear a field', () => {
		expect(updateEventSchema.safeParse({ accessInfo: null, playlistId: null }).success).toBe(true);
	});

	it('refuses an end before the start when both are sent', () => {
		const result = updateEventSchema.safeParse({ startsAt: iso(3 * hour), endsAt: iso(hour) });
		expect(result.success).toBe(false);
	});
});

describe('geocodeQuerySchema', () => {
	it('trims the address', () => {
		expect(geocodeQuerySchema.parse({ q: '  1 rue de Paris ' })).toEqual({ q: '1 rue de Paris' });
	});

	it.each([{}, { q: '   ' }, { q: 'x'.repeat(201) }, { q: ['a', 'b'] }])('refuses %o', query => {
		expect(geocodeQuerySchema.safeParse(query).success).toBe(false);
	});
});
