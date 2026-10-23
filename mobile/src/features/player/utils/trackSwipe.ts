/** Past this horizontal distance, or this flick speed, a swipe changes track. */
const SWIPE_TRACK_THRESHOLD = 80;
export const SWIPE_FLICK_VELOCITY = 800;

interface SwipeEnd {
	translationX: number;
	translationY: number;
	velocityX: number;
}

/** Which track a released horizontal swipe asks for; shared by the mini-player and the player modal. */
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
