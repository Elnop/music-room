import { useLayoutEffect } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
	runOnJS,
	useSharedValue,
	withDelay,
	withSequence,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { largeArtwork } from '@/features/playback/shared/artwork/artwork';
import type { QueueItem } from '@/shared/playback/types/playbackTypes';
import { hapticTap } from '@/shared/theme/lib/haptics';
import { trackSwipeDirection } from '@/features/playback/shared/track-swipe/trackSwipe';
import { displayedQueueIndex } from '@/features/playback/features/player-modal/displayedQueueIndex';
import { useArtworkSize } from '@/features/playback/features/player-modal/hooks/useArtworkSize';
import type { NowPlayingTrack } from '@/features/playback/shared/player/lib/types';
import { useActiveQueue, useQueueStore } from '@/features/playback/shared/player/stores/queueStore';

const EDGE_RESISTANCE = 0.25;
const SETTLE_TIMEOUT_MS = 2500;
const SWIPE_MS = 200;
const TRACK_CHANGE_MS = 260;
const WINDOW = 2;

export type CarouselSlot = {
	key: string;
	index: number;
	uri: string | null;
	title: string;
	artist: string;
};

export type ArtworkCarousel = {
	slots: CarouselSlot[];
	center: SharedValue<number>;
	drag: SharedValue<number>;
	hasPrevious: boolean;
	hasNext: boolean;
	panGesture: ReturnType<typeof Gesture.Pan>;
	artworkSize: number;
	artworkStep: number;
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

export function useArtworkCarousel(
	track: NowPlayingTrack | null,
	artworkUrl: string | null
): ArtworkCarousel {
	const queue = useActiveQueue();
	const { size, step: artworkStep } = useArtworkSize();
	const shown = displayedQueueIndex(queue.items, queue.currentItemId, track?.id ?? null);
	const anchor = shown >= 0 ? shown : 0;
	const slots: CarouselSlot[] =
		shown >= 0
			? queueSlots(queue.items, shown)
			: track
				? [{ key: 'current', index: 0, uri: artworkUrl, title: track.title, artist: track.artist }]
				: [];
	const hasPrevious = shown > 0;
	const hasNext = shown >= 0 && shown < queue.items.length - 1;

	const center = useSharedValue(anchor);
	const drag = useSharedValue(0);

	useLayoutEffect(() => {
		center.value =
			Math.abs(center.value - anchor) > 1.5
				? anchor
				: withTiming(anchor, { duration: TRACK_CHANGE_MS });
	}, [anchor, track?.id, center]);

	function step(direction: 'next' | 'previous') {
		hapticTap();
		void (direction === 'next'
			? useQueueStore.getState().next()
			: useQueueStore.getState().previous());
	}

	function settleFromDrag() {
		'worklet';
		center.value = center.value - drag.value / artworkStep;
		drag.value = 0;
	}

	const panGesture = Gesture.Pan()
		.withTestId('player-artwork-pan')
		.activeOffsetX([-15, 15])
		.failOffsetY([-10, 10])
		.onUpdate(event => {
			const blocked =
				(event.translationX < 0 && !hasNext) || (event.translationX > 0 && !hasPrevious);
			drag.value = blocked ? event.translationX * EDGE_RESISTANCE : event.translationX;
		})
		.onEnd(event => {
			const direction = trackSwipeDirection(event);
			settleFromDrag();
			if ((direction === 'next' && hasNext) || (direction === 'previous' && hasPrevious)) {
				center.value = withSequence(
					withTiming(anchor + (direction === 'next' ? 1 : -1), { duration: SWIPE_MS }),
					withDelay(SETTLE_TIMEOUT_MS, withSpring(anchor))
				);
				runOnJS(step)(direction);
			} else {
				center.value = withSpring(anchor);
			}
		});

	return {
		slots,
		center,
		drag,
		hasPrevious,
		hasNext,
		panGesture,
		artworkSize: size,
		artworkStep,
	};
}
