import type { StreamProtocol } from '@/types/soundcloud.types';

/** What the player hooks use of an expo-audio player, which the browser player also implements. */
export interface AudioPlayer {
	readonly id: number;
	readonly playing: boolean;
	readonly isLoaded: boolean;
	readonly duration: number;
	readonly currentTime: number;
	volume: number;
	play(): void;
	pause(): void;
	seekTo(seconds: number): Promise<void>;
}

export interface AudioPlayerStatus {
	id: number;
	playing: boolean;
	isLoaded: boolean;
	isBuffering: boolean;
	duration: number;
	currentTime: number;
	didJustFinish: boolean;
	playbackState: string;
}

export interface PlayerContextValue {
	player: AudioPlayer;
	loading: boolean;
	error: string | null;
	/** Renews an expiring stream URL by reloading at `seconds`. */
	seekTo: (seconds: number) => void;
}

export interface StreamFetchResult {
	streamUrl: string;
	protocol: StreamProtocol;
	expiresAt: number | null;
}

export interface PrefetchedStream extends StreamFetchResult {
	queueItemId: string;
	permalink: string;
}

export interface NowPlayingTrack {
	id: number;
	title: string;
	artist: string;
	artworkUrl: string | null;
}

export interface NowPlaying {
	isRemote: boolean;
	track: NowPlayingTrack | null;
	isPlaying: boolean;
	isLoading: boolean;
	canToggle: boolean;
	positionMs: number;
	durationMs: number | null;
	deviceLabel: string | null;
	toggle: () => void;
	next: () => void;
	previous: () => void;
	hasNext: boolean;
	hasPrevious: boolean;
}
