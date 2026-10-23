import { useEffect } from 'react';
import {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	runOnJS,
	Easing,
} from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';
import {
	DISMISS_THRESHOLD,
	SCREEN_HEIGHT,
} from '@/features/player/components/modal/components/presenters/playerModalStyles';

export function usePlayerModalGestures(isModalOpen: boolean, onClose: () => void) {
	const translateY = useSharedValue(0);

	const panGesture = Gesture.Pan()
		.withTestId('player-modal-pan')
		.activeOffsetY(10)
		.failOffsetX([-15, 15])
		.onUpdate(event => {
			if (event.translationY > 0) {
				translateY.value = event.translationY;
			}
		})
		.onEnd(event => {
			if (event.translationY > DISMISS_THRESHOLD || event.velocityY > 500) {
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
		});

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));

	useEffect(() => {
		if (isModalOpen) {
			translateY.value = 0;
		}
	}, [isModalOpen, translateY]);

	return { panGesture, animatedStyle };
}
