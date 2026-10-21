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
import { usePlayer } from '@/contexts/PlayerContext';
import { useNowPlaying, type NowPlaying } from '@/hooks/useNowPlaying';
import { largeArtwork } from '@/utils/artwork';

/** A position this far from where the system extrapolates it is a jump (seek, restart, renewal). */
const POSITION_JUMP_MS = 2000;

/** Native calls can fail (session gone, validation); the system controls are best effort. */
function safely(call: Promise<void>): void {
	call.catch(err => {
		if (__DEV__) console.warn('[MediaSessionBridge] Media control call failed:', err);
	});
}

/** A play / pause the app may not follow is re-sent after this delay (#309). */
const STATE_RESYNC_MS = 1000;

/**
 * Commands the system controls offer: no seek in remote mode (#297), next only
 * when a next item exists, previous in remote mode only when the app allows it.
 */
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

/**
 * Shows the playing track in the system media controls (Android notification,
 * lock screen, iOS Control Center) and routes their buttons to the same actions
 * as the in-app player (#309). Only displays and forwards: queue, auto-advance
 * and remote mode stay in `useNowPlaying`. Mounted in `PlayerProvider`, so the
 * controls go away when playback stops (no track) and on logout (unmount).
 */
export function MediaSessionBridge() {
	const nowPlaying = useNowPlaying();
	const { seekTo } = usePlayer();
	const { track, isRemote, hasNext, hasPrevious, positionMs, durationMs } = nowPlaying;

	// Latest values for the listener, which is registered once.
	const latestRef = useRef({ nowPlaying, seekTo });
	useEffect(() => {
		latestRef.current = { nowPlaying, seekTo };
	});
	const sentRef = useRef<SentState | null>(null);
	const resyncRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		// Android shows play / pause optimistically; when the app does not follow
		// (still loading, toggle refused, remote device silent), the computed state
		// does not change, so send the real one again.
		const scheduleResync = () => {
			if (resyncRef.current) clearTimeout(resyncRef.current);
			resyncRef.current = setTimeout(() => {
				resyncRef.current = null;
				const current = latestRef.current.nowPlaying;
				sentRef.current = null;
				if (!current.track) return;
				const state = systemState(current);
				const positionMs = Math.max(0, current.positionMs);
				sentRef.current = { state, positionMs, at: Date.now() };
				safely(updatePlaybackState(state, positionMs / 1000));
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

	// Whole seconds: the local duration is read every 100 ms and starts at 0 while loading.
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
		// A new track restarts the position the system shows.
		sentRef.current = null;
	}, [trackId, title, artist, artworkUrl, durationSeconds]);

	const state = systemState(nowPlaying);
	useEffect(() => {
		if (!hasTrack) return;
		const now = Date.now();
		const sent = sentRef.current;
		if (sent && sent.state === state) {
			// The system extrapolates the position while playing; send it again only on a jump.
			const elapsed = state === PlaybackState.PLAYING ? now - sent.at : 0;
			if (Math.abs(positionMs - (sent.positionMs + elapsed)) < POSITION_JUMP_MS) return;
		}
		sentRef.current = { state, positionMs, at: now };
		safely(updatePlaybackState(state, Math.max(0, positionMs) / 1000));
	}, [hasTrack, state, positionMs, trackId, durationSeconds]);

	return null;
}
