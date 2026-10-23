import type { useAudioPlayer } from 'expo-audio';

export interface PlayerContextValue {
	player: ReturnType<typeof useAudioPlayer>;
	loading: boolean;
	error: string | null;
	/** Renews an expiring stream URL by reloading at `seconds`. */
	seekTo: (seconds: number) => void;
}

export interface StreamFetchResult {
	streamUrl: string;
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
