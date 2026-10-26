import { NEARBY_RADIUS_M } from '@/features/events/constants';
import { isOngoing } from '@/features/events/utils/eventDates';
import { distanceMeters } from '@/features/events/utils/geo';
import type { Coordinates } from '@/features/events/utils/eventLocation';
import type { MusicEvent } from '@/features/events/types';

interface NearbyEvent {
	event: MusicEvent;
	/** Metres from the phone, by GPS. */
	distance: number;
}

/** Ongoing events within the radius, nearest first. Runs on the phone: the position is never sent. */
export function nearbyByGps(
	events: MusicEvent[],
	position: Coordinates,
	now = Date.now(),
	radius = NEARBY_RADIUS_M
): NearbyEvent[] {
	return events
		.filter(event => isOngoing(event, now))
		.map(event => ({ event, distance: distanceMeters(position, event) }))
		.filter(nearby => nearby.distance <= radius)
		.sort((a, b) => a.distance - b.distance);
}
