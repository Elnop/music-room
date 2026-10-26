export const FETCH_TIMEOUT_MS = 8000;

export const PLAYER_LOAD_TIMEOUT_MS = 10000;

/** A renewed stream that played this long past its start position is healthy again. */
export const RENEWAL_HEALTHY_MS = 30 * 1000;

/** The next queue item's stream URL is fetched this many seconds before the track end. */
export const PREFETCH_WINDOW_S = 20;

/** How far a keyboard or screen-reader step moves the playback position. */
export const SEEK_STEP_S = 10;
