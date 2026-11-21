import { logger } from '@/shared/logging/logger';
import type {
	ActionHandler,
	BrowserMediaSession,
	MediaAction,
	MediaHandlers,
	MetadataInit,
} from '@/features/playback/features/media-session/mediaSessionTypes';

type BrowserGlobals = {
	navigator?: { mediaSession?: BrowserMediaSession };
	MediaMetadata?: new (init: MetadataInit) => unknown;
};

const browser = globalThis as unknown as BrowserGlobals;
const MEDIA_ACTIONS: MediaAction[] = ['play', 'pause', 'previoustrack', 'nexttrack', 'seekto'];

export function browserMediaSession(): BrowserMediaSession | undefined {
	return browser.navigator?.mediaSession;
}

export function browserMetadata(
	title: string | undefined,
	init: Omit<MetadataInit, 'title'>
): unknown {
	const Metadata = browser.MediaMetadata;
	return title !== undefined && Metadata ? new Metadata({ title, ...init }) : null;
}

function setHandler(session: BrowserMediaSession, action: MediaAction, handler: ActionHandler) {
	try {
		session.setActionHandler(action, handler);
	} catch (err) {
		logger.debug(`[MediaSession] Action ${action} not supported by this browser:`, err);
	}
}

export function setMediaHandlers(
	session: BrowserMediaSession,
	handlers: MediaHandlers | null
): void {
	for (const action of MEDIA_ACTIONS) {
		setHandler(session, action, handlers ? handlers[action] : null);
	}
}
