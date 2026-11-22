import { useEffect, useMemo } from 'react';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import { autoplayStore } from '@/features/playback/autoplayStore';
import { HtmlAudioPlayer } from '@/features/playback/lib/HtmlAudioPlayer';
import type {
	AudioPlayer,
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
		[source, protocol],
	);
	useEffect(() => {
		player.attach();
		return () => player.detach();
	}, [player]);
	return player;
}
