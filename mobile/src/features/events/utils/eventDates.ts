const HOUR = 3_600_000;
const DEFAULT_DURATION = 3 * HOUR;

/** Starts at the next full hour, for three hours. */
export function defaultSchedule(now = new Date()): { startsAt: Date; endsAt: Date } {
	const startsAt = new Date(now);
	startsAt.setMinutes(0, 0, 0);
	startsAt.setTime(startsAt.getTime() + HOUR);
	return { startsAt, endsAt: new Date(startsAt.getTime() + DEFAULT_DURATION) };
}

export function formatEventDate(date: Date | string): string {
	return new Date(date).toLocaleString('fr-FR', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	});
}

export function isOngoing(event: { startsAt: string; endsAt: string }, now = Date.now()): boolean {
	return Date.parse(event.startsAt) <= now && now < Date.parse(event.endsAt);
}

/** An error message, or null when the schedule can be saved. */
export function scheduleError(startsAt: Date, endsAt: Date, now = Date.now()): string | null {
	if (endsAt.getTime() <= startsAt.getTime()) return 'La fin doit être après le début';
	if (endsAt.getTime() <= now) return 'Cet événement est déjà terminé';
	return null;
}
