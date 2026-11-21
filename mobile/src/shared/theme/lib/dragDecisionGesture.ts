import { Gesture } from 'react-native-gesture-handler';
import type { GestureTouchEvent } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

const DRAG_DECISION_SLOP = 10;

type TouchPoint = { x: number; y: number };

function movedBeyondSlop(event: GestureTouchEvent, start: TouchPoint): boolean {
	'worklet';
	const touch = event.allTouches[0];
	const moved = Math.max(Math.abs(touch.absoluteX - start.x), Math.abs(touch.absoluteY - start.y));
	return moved > DRAG_DECISION_SLOP;
}

export function dragDecisionGesture(
	dragRequested: SharedValue<boolean>,
	touchStart: SharedValue<TouchPoint>
) {
	return Gesture.Pan()
		.manualActivation(true)
		.onTouchesDown(event => {
			touchStart.set({ x: event.allTouches[0].absoluteX, y: event.allTouches[0].absoluteY });
		})
		.onTouchesMove((event, manager) => {
			if (dragRequested.get()) {
				manager.activate();
				return;
			}
			if (movedBeyondSlop(event, touchStart.get())) manager.fail();
		})
		.onTouchesUp(() => {
			dragRequested.set(false);
		})
		.onTouchesCancelled(() => {
			dragRequested.set(false);
		});
}
