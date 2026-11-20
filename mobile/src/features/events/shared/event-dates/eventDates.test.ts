import { defaultSchedule, isOngoing, scheduleError } from './eventDates';

const HOUR = 3_600_000;

describe('defaultSchedule', () => {
	it('starts at the next full hour, for three hours', () => {
		const { startsAt, endsAt } = defaultSchedule(new Date(2026, 10, 6, 19, 25));
		expect(startsAt).toEqual(new Date(2026, 10, 6, 20, 0));
		expect(endsAt.getTime() - startsAt.getTime()).toBe(3 * HOUR);
	});
});

describe('scheduleError', () => {
	const now = Date.UTC(2026, 10, 6, 12);

	it('accepts an upcoming or ongoing event', () => {
		expect(scheduleError(new Date(now - HOUR), new Date(now + HOUR), now)).toBeNull();
	});

	it('refuses an end before the start, and an event already over', () => {
		expect(scheduleError(new Date(now + 2 * HOUR), new Date(now + HOUR), now)).toMatch(/après/);
		expect(scheduleError(new Date(now - 2 * HOUR), new Date(now - HOUR), now)).toMatch(/terminé/);
	});
});

describe('isOngoing', () => {
	it('is true between the start and the end only', () => {
		const event = { startsAt: new Date(0).toISOString(), endsAt: new Date(HOUR).toISOString() };
		expect(isOngoing(event, HOUR / 2)).toBe(true);
		expect(isOngoing(event, HOUR)).toBe(false);
	});
});
