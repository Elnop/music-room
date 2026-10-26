import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { useAutoplayStore } from '@/features/player/stores/autoplayStore';
import type { AudioPlayer, AudioPlayerStatus } from '@/features/player/types';
import { HtmlAudioPlayer, type PlaybackEvents } from './htmlAudioPlayer';

// Browser variant of audioPlayer.ts: expo-audio's web player cannot read HLS outside Safari.

const playbackEvents: PlaybackEvents = {
	// Paused in the store, so the delegation status never reports a playback the browser refused.
	onPlayBlocked: () => {
		useAutoplayStore.getState().setBlocked(true);
		usePlayerStore.getState().pause();
	},
	onPlaying: () => useAutoplayStore.getState().setBlocked(false),
};

export function useAudioPlayer(source: string): AudioPlayer {
	const player = useMemo(() => new HtmlAudioPlayer(source, playbackEvents), [source]);
	useEffect(() => {
		player.attach();
		return () => player.detach();
	}, [player]);
	return player;
}

/** The player always comes from useAudioPlayer above, so it is a browser player. */
export function useAudioPlayerStatus(player: AudioPlayer): AudioPlayerStatus {
	const browserPlayer = player as HtmlAudioPlayer;
	return useSyncExternalStore(browserPlayer.subscribe, browserPlayer.getStatus);
}
