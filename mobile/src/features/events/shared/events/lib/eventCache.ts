import type { MusicEvent } from '@/features/events/eventTypes';

function byStart(a: MusicEvent, b: MusicEvent) {
	return Date.parse(a.startsAt) - Date.parse(b.startsAt);
}

export function upsertEvent(list: MusicEvent[], event: MusicEvent, now = Date.now()): MusicEvent[] {
	const others = list.filter((current) => current.id !== event.id);
	if (Date.parse(event.endsAt) <= now) return others;
	return [...others, event].toSorted(byStart);
}

export function removeEvent(list: MusicEvent[], eventId: string): MusicEvent[] {
	return list.filter((event) => event.id !== eventId);
}
