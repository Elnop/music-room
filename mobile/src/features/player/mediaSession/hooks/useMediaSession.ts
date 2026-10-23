import { useEffect, useRef } from 'react';
import {
	Command,
	PlaybackState,
	addListener,
	disableMediaControls,
	enableMediaControls,
	updateMetadata,
	updatePlaybackState,
	type MediaControlEvent,
	type MediaMetadata,
} from 'expo-media-control';
import { usePlayer } from '@/features/player/context/PlayerContext';
import { useNowPlaying, type NowPlaying } from '@/features/player/hooks/useNowPlaying';
import { largeArtwork } from '@/shared/utils/artwork';
import { logger } from '@/shared/utils/logger';

const POSITION_JUMP_MS = 2000;
const STATE_RESYNC_MS = 1000;

function safely(call: Promise<void>): void {
	call.catch(err => {
		logger.debug('[MediaSession] Media control call failed:', err);
	});
}

function mediaCapabilities(isRemote: boolean, hasNext: boolean, hasPrevious: boolean): Command[] {
	const capabilities = [Command.PLAY, Command.PAUSE];
	if (!isRemote || hasPrevious) capabilities.push(Command.PREVIOUS_TRACK);
	if (hasNext) capabilities.push(Command.NEXT_TRACK);
	if (!isRemote) capabilities.push(Command.SEEK);
	return capabilities;
}

function systemState(nowPlaying: NowPlaying): PlaybackState {
	if (nowPlaying.isLoading) return PlaybackState.BUFFERING;
	return nowPlaying.isPlaying ? PlaybackState.PLAYING : PlaybackState.PAUSED;
}

interface SentState {
	state: PlaybackState;
	positionMs: number;
	at: number;
}

export function useMediaSession(): void {
	const nowPlaying = useNowPlaying();
	const { seekTo } = usePlayer();
	const { track, isRemote, hasNext, hasPrevious, positionMs, durationMs } = nowPlaying;

	const latestRef = useRef({ nowPlaying, seekTo });
	useEffect(() => {
		latestRef.current = { nowPlaying, seekTo };
	});
	const sentRef = useRef<SentState | null>(null);
	const resyncRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const scheduleResync = () => {
			if (resyncRef.current) clearTimeout(resyncRef.current);
			resyncRef.current = setTimeout(() => {
				resyncRef.current = null;
				const current = latestRef.current.nowPlaying;
				sentRef.current = null;
				if (!current.track) return;
				const state = systemState(current);
				const posMs = Math.max(0, current.positionMs);
				sentRef.current = { state, positionMs: posMs, at: Date.now() };
				safely(updatePlaybackState(state, posMs / 1000));
			}, STATE_RESYNC_MS);
		};

		const removeListener = addListener((event: MediaControlEvent) => {
			const { nowPlaying: current, seekTo: seek } = latestRef.current;
			switch (event.command) {
				case Command.PLAY:
					if (!current.isPlaying) current.toggle();
					scheduleResync();
					break;
				case Command.PAUSE:
					if (current.isPlaying) current.toggle();
					scheduleResync();
					break;
				case Command.NEXT_TRACK:
					current.next();
					break;
				case Command.PREVIOUS_TRACK:
					current.previous();
					break;
				case Command.SEEK: {
					const position: unknown = event.data?.position;
					if (!current.isRemote && typeof position === 'number' && Number.isFinite(position)) {
						seek(Math.max(0, position));
					}
					break;
				}
			}
		});
		return () => {
			if (resyncRef.current) clearTimeout(resyncRef.current);
			removeListener();
			safely(disableMediaControls());
		};
	}, []);

	const hasTrack = track !== null;
	useEffect(() => {
		if (!hasTrack) {
			sentRef.current = null;
			safely(disableMediaControls());
			return;
		}
		safely(
			enableMediaControls({ capabilities: mediaCapabilities(isRemote, hasNext, hasPrevious) })
		);
	}, [hasTrack, isRemote, hasNext, hasPrevious]);

	const durationSeconds = durationMs && durationMs > 0 ? Math.round(durationMs / 1000) : null;
	const trackId = track?.id;
	const title = track?.title;
	const artist = track?.artist;
	const artworkUrl = largeArtwork(track?.artworkUrl);

	useEffect(() => {
		if (trackId === undefined || title === undefined) return;
		const metadata: MediaMetadata = { title, artist };
		if (artworkUrl) metadata.artwork = { uri: artworkUrl };
		if (durationSeconds !== null) metadata.duration = durationSeconds;
		safely(updateMetadata(metadata));
		sentRef.current = null;
	}, [trackId, title, artist, artworkUrl, durationSeconds]);

	const state = systemState(nowPlaying);
	useEffect(() => {
		if (!hasTrack) return;
		const now = Date.now();
		const sent = sentRef.current;
		if (sent && sent.state === state) {
			const elapsed = state === PlaybackState.PLAYING ? now - sent.at : 0;
			if (Math.abs(positionMs - (sent.positionMs + elapsed)) < POSITION_JUMP_MS) return;
		}
		sentRef.current = { state, positionMs, at: now };
		safely(updatePlaybackState(state, Math.max(0, positionMs) / 1000));
	}, [hasTrack, state, positionMs, trackId, durationSeconds]);
}
