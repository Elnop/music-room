import type {
	ActionHandler,
	LatestRef,
	MediaHandlers,
} from '@/features/playback/features/media-session/mediaSessionTypes';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';

function seekHandler(latest: LatestRef): ActionHandler {
	return ({ seekTime }) => {
		if (typeof seekTime === 'number' && Number.isFinite(seekTime)) {
			latest.current.seekTo(Math.max(0, seekTime));
		}
	};
}

type HandlerCapabilities = Pick<NowPlaying, 'isRemote' | 'hasNext' | 'hasPrevious'>;

export function browserMediaHandlers(
	latest: LatestRef,
	capabilities: HandlerCapabilities
): MediaHandlers {
	function current() {
		return latest.current.nowPlaying;
	}
	return {
		play: () => {
			if (!current().isPlaying) current().toggle();
		},
		pause: () => {
			if (current().isPlaying) current().toggle();
		},
		previoustrack:
			!capabilities.isRemote || capabilities.hasPrevious ? () => current().previous() : null,
		nexttrack: capabilities.hasNext ? () => current().next() : null,
		seekto: capabilities.isRemote ? null : seekHandler(latest),
	};
}
