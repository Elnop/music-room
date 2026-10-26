/** An ongoing event within this distance of the phone shows in "Événements à proximité". */
export const NEARBY_RADIUS_M = 300;

/** How often the section re-checks which events are ongoing, so an ended one leaves on its own. */
export const NEARBY_CLOCK_MS = 30_000;

/** A beacon not heard for this long is gone: its broadcast stopped or the phone moved away. */
export const BEACON_TIMEOUT_MS = 8_000;

/** How often heard beacons are re-checked for silence. */
export const BEACON_PRUNE_MS = 2_000;
