import type { OwnerQueue } from '@/shared/playback/types/playbackTypes';
import type { ConnectTarget } from '@/features/playback/shared/player/types/queueTypes';

export const FETCH_TIMEOUT_MS = 8000;

export const PLAYER_LOAD_TIMEOUT_MS = 10000;

export const RENEWAL_HEALTHY_MS = 30 * 1000;

export const PREFETCH_WINDOW_S = 20;

export const PREFETCH_AFTER_PLAYED_S = 3;

export const SEEK_STEP_S = 10;

export const UP_NEXT_COUNT = 5;

export const PANEL_ID = 'now-playing-panel';
export const PANEL_CLOSE_ID = 'now-playing-panel-close';

export const RESTART_THRESHOLD_S = 3;

export const STREAM_RENEW_MARGIN_MS = 2 * 60 * 1000;

export const EMPTY_QUEUE: OwnerQueue = Object.freeze({
	currentItemId: null,
	items: [],
	version: 0,
}) as OwnerQueue;

export const LOCAL_TARGET: ConnectTarget = { kind: 'local' };
