import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/** Skips the first focus: the queries already load on mount. */
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
