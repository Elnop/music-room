import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { usePlayerStore } from '@/features/playback/shared/player/stores/playerStore';
import { useAutoplayStore } from '@/features/playback/shared/player/stores/autoplayStore';
import type { AudioPlayer, AudioPlayerStatus } from '@/features/playback/shared/player/lib/types';
import type { StreamProtocol } from '@/shared/tracks/lib/soundcloud.types';
import { HtmlAudioPlayer } from '@/features/playback/shared/player/lib/htmlAudioPlayer';
import type { PlaybackEvents } from '@/features/playback/shared/player/lib/htmlAudioPlayer';

const playbackEvents: PlaybackEvents = {
	onPlayBlocked: () => {
		useAutoplayStore.getState().setBlocked(true);
		usePlayerStore.getState().pause();
	},
	onPlaying: () => useAutoplayStore.getState().setBlocked(false),
};

export function useAudioPlayer(source: string, protocol: StreamProtocol): AudioPlayer {
	const player = useMemo(
		() => new HtmlAudioPlayer(source, protocol, playbackEvents),
		[source, protocol]
	);
	useEffect(() => {
		player.attach();
		return () => player.detach();
	}, [player]);
	return player;
}

export function useAudioPlayerStatus(player: AudioPlayer): AudioPlayerStatus {
	const browserPlayer = player as HtmlAudioPlayer;
	return useSyncExternalStore(browserPlayer.subscribe, browserPlayer.getStatus);
}
