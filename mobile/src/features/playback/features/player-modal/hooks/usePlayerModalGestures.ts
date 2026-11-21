import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import {
	modalDismissGesture,
	sliderNativeGesture,
} from '@/features/playback/features/player-modal/lib/modalDismissGesture';

export function usePlayerModalGestures(isModalOpen: boolean, onClose: () => void) {
	const translateY = useSharedValue(0);
	const sliderGesture = sliderNativeGesture();
	const panGesture = modalDismissGesture(translateY, sliderGesture, onClose);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
	}));

	useEffect(() => {
		if (isModalOpen) {
			translateY.value = 0;
		}
	}, [isModalOpen, translateY]);

	return { panGesture, sliderGesture, animatedStyle };
}
