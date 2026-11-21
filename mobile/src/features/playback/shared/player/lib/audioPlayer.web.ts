import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import { autoplayStore } from '@/features/playback/shared/player/stores/autoplayStore';
import { HtmlAudioPlayer } from '@/features/playback/shared/player/lib/HtmlAudioPlayer';
import type {
	AudioPlayer,
	AudioPlayerStatus,
	PlaybackEvents,
} from '@/features/playback/shared/player/types/playerTypes';
import type { StreamProtocol } from '@/shared/tracks/types/soundcloudTypes';

const playbackEvents: PlaybackEvents = {
	onPlayBlocked: () => {
		autoplayStore.getState().setBlocked(true);
		playerStore.getState().pause();
	},
	onPlaying: () => autoplayStore.getState().setBlocked(false),
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
