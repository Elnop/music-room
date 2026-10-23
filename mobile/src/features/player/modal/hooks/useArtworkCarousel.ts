import { useLayoutEffect } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
	interpolate,
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSequence,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import { getPlayback, useActiveQueue } from '@/shared/services/playbackBridge';
import { nextItem, previousItem } from '@/shared/utils/queueNavigation';
import { largeArtwork } from '@/shared/utils/artwork';
import { hapticTap } from '@/shared/utils/haptics';
import { trackSwipeDirection } from '@/features/player/utils/trackSwipe';
import { ARTWORK_STEP } from '@/features/player/modal/components/presenters/playerModalStyles';

/** A swipe toward a missing neighbour moves this fraction of the finger, then springs back. */
const EDGE_RESISTANCE = 0.25;
/** The artwork springs back if the queue has not moved to the new track by then. */
const SETTLE_TIMEOUT_MS = 2500;

export interface ArtworkCarousel {
	previousArtworkUrl: string | null;
	nextArtworkUrl: string | null;
	hasPrevious: boolean;
	hasNext: boolean;
	panGesture: ReturnType<typeof Gesture.Pan>;
	rowStyle: ReturnType<typeof useAnimatedStyle>;
	infoStyle: ReturnType<typeof useAnimatedStyle>;
}

/** Swiping the artwork steps through the queue: right is always the previous item, never a restart. */
export function useArtworkCarousel(trackKey: string | number | null): ArtworkCarousel {
	const queue = useActiveQueue();
	const previous = trackKey === null ? undefined : previousItem(queue);
	const next = trackKey === null ? undefined : nextItem(queue);
	const hasPrevious = previous !== undefined;
	const hasNext = next !== undefined;
	const translateX = useSharedValue(0);

	// The new track's artwork now sits in the centre slot: recentre before paint, without animating.
	useLayoutEffect(() => {
		translateX.value = 0;
	}, [trackKey, translateX]);

	const step = (direction: 'next' | 'previous') => {
		hapticTap();
		void (direction === 'next' ? getPlayback().next() : getPlayback().previous());
	};

	/** Slides to the neighbour, then springs back unless the track change recentres it first. */
	const slideTo = (offset: number) => {
		'worklet';
		translateX.value = withSequence(
			withTiming(offset, { duration: 200 }),
			withDelay(SETTLE_TIMEOUT_MS, withSpring(0))
		);
	};

	const panGesture = Gesture.Pan()
		.withTestId('player-artwork-pan')
		.activeOffsetX([-15, 15])
		.failOffsetY([-10, 10])
		.onUpdate(event => {
			const blocked =
				(event.translationX < 0 && !hasNext) || (event.translationX > 0 && !hasPrevious);
			translateX.value = blocked ? event.translationX * EDGE_RESISTANCE : event.translationX;
		})
		.onEnd(event => {
			const direction = trackSwipeDirection(event);
			if (direction === 'next' && hasNext) {
				slideTo(-ARTWORK_STEP);
				runOnJS(step)('next');
			} else if (direction === 'previous' && hasPrevious) {
				slideTo(ARTWORK_STEP);
				runOnJS(step)('previous');
			} else {
				translateX.value = withSpring(0);
			}
		});

	const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
	const infoStyle = useAnimatedStyle(() => ({
		opacity: interpolate(Math.abs(translateX.value), [0, ARTWORK_STEP], [1, 0.2]),
	}));

	return {
		previousArtworkUrl: previous ? largeArtwork(previous.track.albumArt) : null,
		nextArtworkUrl: next ? largeArtwork(next.track.albumArt) : null,
		hasPrevious,
		hasNext,
		panGesture,
		rowStyle,
		infoStyle,
	};
}
