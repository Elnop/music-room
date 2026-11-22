import { Gesture } from 'react-native-gesture-handler';
import type {
	GestureStateChangeEvent,
	PanGesture,
	PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import { runOnJS, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { trackSwipeDirection } from '@/features/playback/shared/track-swipe/trackSwipeDirection';
import type { CarouselMotion } from '@/features/playback/features/player-modal/playerModalTypes';

const EDGE_RESISTANCE = 0.25;
const SETTLE_TIMEOUT_MS = 2500;
const SWIPE_MS = 200;

type CarouselBounds = {
	anchor: number;
	hasPrevious: boolean;
	hasNext: boolean;
};

type SwipeStep = (direction: 'next' | 'previous') => void;

type PanEnd = GestureStateChangeEvent<PanGestureHandlerEventPayload>;

function settleFromDrag({ center, drag, step }: CarouselMotion) {
	'worklet';
	center.value = center.value - drag.value / step;
	drag.value = 0;
}

function finishSwipe(
	motion: CarouselMotion,
	bounds: CarouselBounds,
	event: PanEnd,
	onStep: SwipeStep,
) {
	'worklet';
	const { center } = motion;
	const { anchor, hasPrevious, hasNext } = bounds;
	const direction = trackSwipeDirection(event);
	settleFromDrag(motion);
	if ((direction === 'next' && hasNext) || (direction === 'previous' && hasPrevious)) {
		center.value = withSequence(
			withTiming(anchor + (direction === 'next' ? 1 : -1), { duration: SWIPE_MS }),
			withDelay(SETTLE_TIMEOUT_MS, withSpring(anchor)),
		);
		runOnJS(onStep)(direction);
	} else {
		center.value = withSpring(anchor);
	}
}

export function carouselPanGesture(
	motion: CarouselMotion,
	bounds: CarouselBounds,
	onStep: SwipeStep,
): PanGesture {
	const { drag } = motion;
	const { hasPrevious, hasNext } = bounds;
	return Gesture.Pan()
		.withTestId('player-artwork-pan')
		.activeOffsetX([-15, 15])
		.failOffsetY([-10, 10])
		.onUpdate((event) => {
			const blocked =
				(event.translationX < 0 && !hasNext) || (event.translationX > 0 && !hasPrevious);
			drag.value = blocked ? event.translationX * EDGE_RESISTANCE : event.translationX;
		})
		.onEnd((event) => finishSwipe(motion, bounds, event, onStep));
}
