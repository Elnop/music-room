import { Gesture } from 'react-native-gesture-handler';
import type {
	GestureStateChangeEvent,
	NativeGesture,
	PanGesture,
	PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import { Easing, runOnJS, withTiming } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import {
	DISMISS_THRESHOLD,
	SCREEN_HEIGHT,
} from '@/features/playback/features/player-modal/playerModalConfig';

const DISMISS_VELOCITY = 500;

type PanEnd = GestureStateChangeEvent<PanGestureHandlerEventPayload>;

function settleDismiss(translateY: SharedValue<number>, event: PanEnd, onClose: () => void) {
	'worklet';
	if (event.translationY > DISMISS_THRESHOLD || event.velocityY > DISMISS_VELOCITY) {
		translateY.value = withTiming(
			SCREEN_HEIGHT,
			{ duration: 250, easing: Easing.out(Easing.cubic) },
			() => {
				runOnJS(onClose)();
			}
		);
	} else {
		translateY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
	}
}

export function sliderNativeGesture(): NativeGesture {
	return Gesture.Native().withTestId('player-seek-native');
}

export function modalDismissGesture(
	translateY: SharedValue<number>,
	sliderGesture: NativeGesture,
	onClose: () => void
): PanGesture {
	return Gesture.Pan()
		.withTestId('player-modal-pan')
		.requireExternalGestureToFail(sliderGesture)
		.activeOffsetY(10)
		.failOffsetX([-15, 15])
		.onUpdate(event => {
			if (event.translationY > 0) {
				translateY.value = event.translationY;
			}
		})
		.onEnd(event => settleDismiss(translateY, event, onClose));
}
