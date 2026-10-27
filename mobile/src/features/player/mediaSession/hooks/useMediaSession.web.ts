import { useEffect, useRef } from 'react';
import { usePlayer } from '@/features/player/context/PlayerContext';
import { useNowPlaying } from '@/features/player/hooks/useNowPlaying';
import { largeArtwork } from '@/shared/utils/artwork';
import { logger } from '@/shared/utils/logger';

// Browser variant: the Media Session API drives the media keys and the browser's media notification.

type MediaAction = 'play' | 'pause' | 'previoustrack' | 'nexttrack' | 'seekto';
type ActionHandler = ((details: { seekTime?: number }) => void) | null;

interface MetadataInit {
	title: string;
	artist: string;
	artwork: { src: string }[];
}

// The project compiles without the DOM library, so the Media Session API is typed here.
interface BrowserMediaSession {
	metadata: unknown;
	playbackState: 'none' | 'paused' | 'playing';
	setActionHandler(action: MediaAction, handler: ActionHandler): void;
	setPositionState?(state: { duration: number; position: number; playbackRate: number }): void;
}

interface BrowserGlobals {
	navigator?: { mediaSession?: BrowserMediaSession };
	MediaMetadata?: new (init: MetadataInit) => unknown;
}

const browser = globalThis as unknown as BrowserGlobals;
const MEDIA_ACTIONS: MediaAction[] = ['play', 'pause', 'previoustrack', 'nexttrack', 'seekto'];

function setHandler(session: BrowserMediaSession, action: MediaAction, handler: ActionHandler) {
	try {
		session.setActionHandler(action, handler);
	} catch (err) {
		logger.debug(`[MediaSession] Action ${action} not supported by this browser:`, err);
	}
}

export function useMediaSession(): void {
	const nowPlaying = useNowPlaying();
	const { seekTo } = usePlayer();
	const { track, isRemote, isPlaying, hasNext, hasPrevious, positionMs, durationMs } = nowPlaying;
	const session = browser.navigator?.mediaSession;

	const latestRef = useRef({ nowPlaying, seekTo });
	useEffect(() => {
		latestRef.current = { nowPlaying, seekTo };
	});

	const hasTrack = track !== null;
	useEffect(() => {
		if (!session) return;
		const current = () => latestRef.current.nowPlaying;
		const handlers: Record<MediaAction, ActionHandler> = {
			play: () => {
				if (!current().isPlaying) current().toggle();
			},
			pause: () => {
				if (current().isPlaying) current().toggle();
			},
			previoustrack: !isRemote || hasPrevious ? () => current().previous() : null,
			nexttrack: hasNext ? () => current().next() : null,
			seekto: isRemote
				? null
				: ({ seekTime }) => {
						if (typeof seekTime === 'number' && Number.isFinite(seekTime)) {
							latestRef.current.seekTo(Math.max(0, seekTime));
						}
					},
		};
		for (const action of MEDIA_ACTIONS) {
			setHandler(session, action, hasTrack ? handlers[action] : null);
		}
		return () => {
			for (const action of MEDIA_ACTIONS) setHandler(session, action, null);
		};
	}, [session, hasTrack, isRemote, hasNext, hasPrevious]);

	const title = track?.title;
	const artist = track?.artist ?? '';
	const artworkUrl = largeArtwork(track?.artworkUrl);
	useEffect(() => {
		if (!session) return;
		const Metadata = browser.MediaMetadata;
		session.metadata =
			title !== undefined && Metadata
				? new Metadata({ title, artist, artwork: artworkUrl ? [{ src: artworkUrl }] : [] })
				: null;
	}, [session, title, artist, artworkUrl]);

	useEffect(() => {
		if (!session) return;
		if (!hasTrack) session.playbackState = 'none';
		else session.playbackState = isPlaying ? 'playing' : 'paused';
	}, [session, hasTrack, isPlaying]);

	// Whole seconds: the browser advances the position itself while it plays.
	const durationSeconds = durationMs && durationMs > 0 ? durationMs / 1000 : null;
	const positionSeconds = Math.floor(Math.max(0, positionMs) / 1000);
	useEffect(() => {
		if (!session?.setPositionState || durationSeconds === null) return;
		const position = Math.min(positionSeconds, durationSeconds);
		try {
			session.setPositionState({ duration: durationSeconds, position, playbackRate: 1 });
		} catch (err) {
			logger.debug('[MediaSession] Position state rejected:', err);
		}
	}, [session, durationSeconds, positionSeconds]);

	useEffect(
		() => () => {
			if (!session) return;
			session.metadata = null;
			session.playbackState = 'none';
		},
		[session]
	);
}
