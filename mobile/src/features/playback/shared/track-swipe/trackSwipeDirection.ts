import {
	SWIPE_FLICK_VELOCITY,
	SWIPE_TRACK_THRESHOLD,
} from '@/features/playback/shared/track-swipe/trackSwipeConfig';

type SwipeEnd = {
	translationX: number;
	translationY: number;
	velocityX: number;
};

export function trackSwipeDirection(event: SwipeEnd): 'next' | 'previous' | null {
	'worklet';
	if (Math.abs(event.translationX) <= Math.abs(event.translationY)) return null;
	if (event.translationX < -SWIPE_TRACK_THRESHOLD || event.velocityX < -SWIPE_FLICK_VELOCITY) {
		return 'next';
	}
	if (event.translationX > SWIPE_TRACK_THRESHOLD || event.velocityX > SWIPE_FLICK_VELOCITY) {
		return 'previous';
	}
	return null;
}
