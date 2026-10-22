import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Runs `refetch` each time the screen comes back into focus. The first focus is
 * skipped: the queries already load on mount.
 */
export function useRefetchOnFocus(refetch: () => unknown): void {
	const firstFocus = useRef(true);
	useFocusEffect(
		useCallback(() => {
			if (firstFocus.current) {
				firstFocus.current = false;
				return;
			}
			refetch();
		}, [refetch])
	);
}
