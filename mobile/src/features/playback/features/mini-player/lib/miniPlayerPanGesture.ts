import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, withSpring } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { SWIPE_FLICK_VELOCITY } from '@/features/playback/shared/track-swipe/trackSwipeConfig';
import { trackSwipeDirection } from '@/features/playback/shared/track-swipe/trackSwipeDirection';
import type { MiniPlayerSwipe } from '@/features/playback/features/mini-player/miniPlayerTypes';

const SWIPE_OPEN_THRESHOLD = 40;

type SwipeEnd = {
	translationX: number;
	translationY: number;
	velocityX: number;
	velocityY: number;
};

type SwipeOutcome = 'next' | 'previous' | 'open' | null;

function swipeOutcome(event: SwipeEnd, canGoNext: boolean, canGoPrevious: boolean): SwipeOutcome {
	'worklet';
	const horizontal = Math.abs(event.translationX) > Math.abs(event.translationY);
	const direction = trackSwipeDirection(event);
	const up = event.translationY < -SWIPE_OPEN_THRESHOLD || event.velocityY < -SWIPE_FLICK_VELOCITY;
	if (direction === 'next' && canGoNext) return 'next';
	if (direction === 'previous' && canGoPrevious) return 'previous';
	return !horizontal && up ? 'open' : null;
}

export function miniPlayerPanGesture(translateX: SharedValue<number>, swipe: MiniPlayerSwipe) {
	const { canGoNext, canGoPrevious, onNext, onPrevious, onOpen } = swipe;
	return Gesture.Pan()
		.withTestId('mini-player-pan')
		.activeOffsetX([-15, 15])
		.activeOffsetY(-15)
		.onUpdate((event) => {
			translateX.value =
				Math.abs(event.translationX) > Math.abs(event.translationY) ? event.translationX : 0;
		})
		.onEnd((event) => {
			const outcome = swipeOutcome(event, canGoNext, canGoPrevious);
			if (outcome === 'next') {
				runOnJS(onNext)();
			} else if (outcome === 'previous') {
				runOnJS(onPrevious)();
			} else if (outcome === 'open') {
				runOnJS(onOpen)();
			}
			translateX.value = withSpring(0);
		});
}
