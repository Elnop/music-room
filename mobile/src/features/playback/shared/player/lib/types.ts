import type { StreamProtocol } from '@/shared/tracks/lib/soundcloud.types';

export type AudioPlayer = {
	readonly id: number;
	readonly playing: boolean;
	readonly isLoaded: boolean;
	readonly duration: number;
	readonly currentTime: number;
	volume: number;
	play(): void;
	pause(): void;
	seekTo(seconds: number): Promise<void>;
};

export type AudioPlayerStatus = {
	id: number;
	playing: boolean;
	isLoaded: boolean;
	isBuffering: boolean;
	duration: number;
	currentTime: number;
	didJustFinish: boolean;
	playbackState: string;
};

export type PlayerContextValue = {
	player: AudioPlayer;
	loading: boolean;
	error: string | null;
	seekTo: (seconds: number) => void;
};

export type StreamFetchResult = {
	streamUrl: string;
	protocol: StreamProtocol;
	expiresAt: number | null;
};

export type PrefetchedStream = StreamFetchResult & {
	queueItemId: string;
	permalink: string;
};

export type NowPlayingTrack = {
	id: number;
	title: string;
	artist: string;
	artworkUrl: string | null;
};

export type NowPlaying = {
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
};
