import { Command, updatePlaybackState } from 'expo-media-control';
import type { MediaControlEvent } from 'expo-media-control';
import {
	safely,
	sentKey,
	systemState,
} from '@/features/playback/features/media-session/lib/mediaControls';
import type {
	MediaSessionLatest,
	SentRef,
} from '@/features/playback/features/media-session/mediaSessionTypes';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';

export function resendPlaybackState(current: NowPlaying, sent: SentRef): void {
	sent.current = null;
	if (!current.track) return;
	const state = systemState(current);
	const positionMs = Math.max(0, current.positionMs);
	sent.current = { state, positionMs, at: Date.now(), key: sentKey(current) };
	safely(updatePlaybackState(state, positionMs / 1000));
}

function seekFromEvent(event: MediaControlEvent, latest: MediaSessionLatest): void {
	const position: unknown = event.data?.position;
	if (!latest.nowPlaying.isRemote && typeof position === 'number' && Number.isFinite(position)) {
		latest.seekTo(Math.max(0, position));
	}
}

function setPlaying(current: NowPlaying, playing: boolean, onToggled: () => void): void {
	if (current.isPlaying !== playing) current.toggle();
	onToggled();
}

export function handleMediaCommand(
	event: MediaControlEvent,
	latest: MediaSessionLatest,
	onToggled: () => void,
): void {
	const current = latest.nowPlaying;
	switch (event.command) {
		case Command.PLAY:
			setPlaying(current, true, onToggled);
			break;
		case Command.PAUSE:
			setPlaying(current, false, onToggled);
			break;
		case Command.NEXT_TRACK:
			current.next();
			break;
		case Command.PREVIOUS_TRACK:
			current.previous();
			break;
		case Command.SEEK:
			seekFromEvent(event, latest);
			break;
	}
}
