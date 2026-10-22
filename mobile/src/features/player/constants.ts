/** MiniPlayer height for padding calculations (content + progress bar + margins) */
export const MINI_PLAYER_HEIGHT = 75;

/** Maximum time in ms for the stream URL API call before timing out */
export const FETCH_TIMEOUT_MS = 8000;

/** Maximum time in ms for the player to load before timing out */
export const PLAYER_LOAD_TIMEOUT_MS = 10000;

/** A renewed stream that played this long past its start position is healthy again (#313) */
export const RENEWAL_HEALTHY_MS = 30 * 1000;

/** The next queue item's stream URL is fetched this many seconds before the track end (#314) */
export const PREFETCH_WINDOW_S = 20;
