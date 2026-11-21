import type { GestureResponderEvent } from 'react-native';
import { hapticSelection, hapticSuccess, hapticTap } from '@/shared/theme/lib/haptics';
import type { Haptic } from '@/shared/theme/types/hapticTypes';

type PressHandler = (event: GestureResponderEvent) => void;

const HAPTICS: Record<Haptic, () => void> = {
	tap: hapticTap,
	selection: hapticSelection,
	success: hapticSuccess,
};

export function withHaptic(
	onPress: PressHandler | null | undefined,
	haptic: Haptic | undefined
): PressHandler | undefined {
	if (!onPress) return undefined;
	return event => {
		if (haptic) HAPTICS[haptic]();
		onPress(event);
	};
}
