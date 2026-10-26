import { NEARBY_RADIUS_M } from '@/features/events/constants';
import { isOngoing } from '@/features/events/utils/eventDates';
import { distanceMeters, formatDistance } from '@/features/events/utils/geo';
import { estimateDistance, type BeaconSighting } from '@/features/events/utils/beaconDistance';
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

export interface NearbyItem {
	event: MusicEvent;
	/** "Tout près" for a beacon heard, else the GPS distance. */
	proximity: string;
}

/** Events heard by beacon first (nearest signal first), then by GPS; each event once. */
export function mergeNearby(
	events: MusicEvent[],
	sightings: ReadonlyMap<number, BeaconSighting>,
	position: Coordinates | null,
	now = Date.now()
): NearbyItem[] {
	const ongoing = events.filter(event => isOngoing(event, now));
	const heard = ongoing
		.flatMap(event => {
			const sighting = sightings.get(event.beaconMinor);
			return sighting
				? [{ event, meters: estimateDistance(sighting.rssi, sighting.measuredPower) }]
				: [];
		})
		.sort((a, b) => a.meters - b.meters)
		.map(({ event }) => ({ event, proximity: 'Tout près' }));
	const heardIds = new Set(heard.map(item => item.event.id));
	const located = position
		? nearbyByGps(ongoing, position, now)
				.filter(({ event }) => !heardIds.has(event.id))
				.map(({ event, distance }) => ({ event, proximity: formatDistance(distance) }))
		: [];
	return [...heard, ...located];
}
