import type { AccessibilityActionEvent, ViewProps } from 'react-native';
import { formatTime } from '@/features/playback/shared/seek-bar/lib/formatTime';

export function adjustableProps(
	times: { position: number; total: number },
	disabled: boolean,
	onAction: (actionName: string) => void,
): ViewProps {
	return {
		accessible: true,
		accessibilityRole: 'adjustable',
		accessibilityLabel: 'Position de lecture',
		accessibilityValue: { text: `${formatTime(times.position)} sur ${formatTime(times.total)}` },
		accessibilityState: { disabled },
		accessibilityActions: [{ name: 'increment' }, { name: 'decrement' }],
		onAccessibilityAction: (event: AccessibilityActionEvent) => {
			if (!disabled) onAction(event.nativeEvent.actionName);
		},
	};
}
