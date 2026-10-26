import type { MusicEvent } from '@/features/events/types';

const byStart = (a: MusicEvent, b: MusicEvent) => Date.parse(a.startsAt) - Date.parse(b.startsAt);

/** The list holds ongoing and upcoming events only, by start date. */
export function upsertEvent(list: MusicEvent[], event: MusicEvent, now = Date.now()): MusicEvent[] {
	const others = list.filter(current => current.id !== event.id);
	if (Date.parse(event.endsAt) <= now) return others;
	return [...others, event].sort(byStart);
}

export function removeEvent(list: MusicEvent[], eventId: string): MusicEvent[] {
	return list.filter(event => event.id !== eventId);
}
