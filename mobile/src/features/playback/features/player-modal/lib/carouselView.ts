import { largeArtwork } from '@/features/playback/shared/artwork/largeArtwork';
import { displayedQueueIndex } from '@/features/playback/features/player-modal/lib/displayedQueueIndex';
import type { OwnerQueue, QueueItem } from '@/shared/playback/types/playbackTypes';
import type { NowPlayingTrack } from '@/features/playback/shared/player/types/playerTypes';
import type { CarouselSlot } from '@/features/playback/features/player-modal/playerModalTypes';

const WINDOW = 2;

type CarouselView = {
	slots: CarouselSlot[];
	anchor: number;
	hasPrevious: boolean;
	hasNext: boolean;
};

function queueSlots(items: QueueItem[], shown: number): CarouselSlot[] {
	const first = Math.max(0, shown - WINDOW);
	return items.slice(first, shown + WINDOW + 1).map((item, offset) => ({
		key: item.id,
		index: first + offset,
		uri: largeArtwork(item.track.albumArt),
		title: item.track.title,
		artist: item.track.artist,
	}));
}

function currentSlots(track: NowPlayingTrack | null, artworkUrl: string | null): CarouselSlot[] {
	if (!track) return [];
	return [{ key: 'current', index: 0, uri: artworkUrl, title: track.title, artist: track.artist }];
}

export function carouselView(
	queue: Pick<OwnerQueue, 'items' | 'currentItemId'>,
	current: { track: NowPlayingTrack | null; artworkUrl: string | null },
): CarouselView {
	const { items } = queue;
	const shown = displayedQueueIndex(items, queue.currentItemId, current.track?.id ?? null);
	return {
		slots: shown >= 0 ? queueSlots(items, shown) : currentSlots(current.track, current.artworkUrl),
		anchor: shown >= 0 ? shown : 0,
		hasPrevious: shown > 0,
		hasNext: shown >= 0 && shown < items.length - 1,
	};
}
