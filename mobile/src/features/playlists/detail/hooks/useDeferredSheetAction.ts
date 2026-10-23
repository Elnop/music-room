import { useRef } from 'react';
import { Platform } from 'react-native';

interface DeferredSheetAction {
	/** Wraps an action: closes the sheet, then runs it. */
	run: (action: () => void) => () => void;
	/** The Modal's onDismiss. */
	onDismiss: () => void;
}

/** On iOS the action waits for onDismiss: an Alert raised while the Modal slides out may be dropped. */
export function useDeferredSheetAction(onClose: () => void): DeferredSheetAction {
	const pendingRef = useRef<(() => void) | null>(null);

	return {
		run: action => () => {
			if (Platform.OS === 'ios') {
				pendingRef.current = action;
				onClose();
				return;
			}
			onClose();
			action();
		},
		onDismiss: () => {
			const action = pendingRef.current;
			pendingRef.current = null;
			action?.();
		},
	};
}
