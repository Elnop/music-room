import {
	capitalizeFirst,
	formatDuration,
	formatRelativeTime,
	truncateText,
} from '@utils/formatters';

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

describe('formatRelativeTime', () => {
	const NOW = new Date('2026-10-05T12:00:00Z');
	const ago = (ms: number) => new Date(NOW.getTime() - ms);

	beforeEach(() => {
		jest.useFakeTimers({ now: NOW });
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it.each([
		[30_000, 'Just now'],
		[5 * 60_000, '5m ago'],
		[3 * 3_600_000, '3h ago'],
		[2 * 86_400_000, '2d ago'],
	])('%i ms ago -> %s', (ms, expected) => {
		expect(formatRelativeTime(ago(ms))).toBe(expected);
	});

	it('falls back to an absolute date after a week', () => {
		expect(formatRelativeTime(ago(8 * 86_400_000))).toMatch(/2026/);
	});
});

describe('truncateText', () => {
	it('keeps text within the limit', () => {
		expect(truncateText('hello', 5)).toBe('hello');
	});

	it('cuts longer text and adds an ellipsis', () => {
		expect(truncateText('hello world', 5)).toBe('hello...');
	});
});

describe('capitalizeFirst', () => {
	it('uppercases the first letter only', () => {
		expect(capitalizeFirst('rock and roll')).toBe('Rock and roll');
	});

	it('handles an empty string', () => {
		expect(capitalizeFirst('')).toBe('');
	});
});
