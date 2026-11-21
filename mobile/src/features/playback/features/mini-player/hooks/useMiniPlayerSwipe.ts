import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { miniPlayerPanGesture } from '@/features/playback/features/mini-player/lib/miniPlayerPanGesture';
import type {
	MiniPlayerData,
	MiniPlayerSwipe,
} from '@/features/playback/features/mini-player/miniPlayerTypes';

export function useMiniPlayerSwipe(
	swipe: MiniPlayerSwipe
): Pick<MiniPlayerData, 'infoStyle' | 'panGesture'> {
	const translateX = useSharedValue(0);
	const panGesture = miniPlayerPanGesture(translateX, swipe);
	const infoStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: translateX.value }],
	}));
	return { infoStyle, panGesture };
}
