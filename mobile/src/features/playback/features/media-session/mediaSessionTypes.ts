import type { RefObject } from 'react';
import type { PlaybackState } from 'expo-media-control';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';

export type SentState = {
	state: PlaybackState;
	positionMs: number;
	at: number;
	key: string;
};

export type MediaSessionLatest = {
	nowPlaying: NowPlaying;
	seekTo: (seconds: number) => void;
};

export type LatestRef = RefObject<MediaSessionLatest>;

export type SentRef = RefObject<SentState | null>;

export type MediaAction = 'play' | 'pause' | 'previoustrack' | 'nexttrack' | 'seekto';

export type ActionHandler = ((details: { seekTime?: number }) => void) | null;

export type MediaHandlers = Record<MediaAction, ActionHandler>;

export type MetadataInit = {
	title: string;
	artist: string;
	artwork: { src: string }[];
};

export type BrowserMediaSession = {
	metadata: unknown;
	playbackState: 'none' | 'paused' | 'playing';
	setActionHandler: (action: MediaAction, handler: ActionHandler) => void;
	setPositionState?: (state: { duration: number; position: number; playbackRate: number }) => void;
};
