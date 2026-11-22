import { formatDuration } from '@/shared/formatting/formatDuration';

describe('formatDuration', () => {
	it.each([
		[0, '0:00'],
		[999, '0:00'],
		[5_000, '0:05'],
		[65_000, '1:05'],
		[600_000, '10:00'],
		[3_725_000, '62:05'],
	])('%i ms -> %s', (ms, expected) => {
		expect(formatDuration(ms)).toBe(expected);
	});
});
