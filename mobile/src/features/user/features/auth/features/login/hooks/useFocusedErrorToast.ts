import { useCallback, useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { showError } from '@/shared/theme/lib/toast';

export function useFocusedErrorToast(): (message: string) => void {
	const isFocused = useIsFocused();
	const focused = useRef(false);
	const pending = useRef<string | null>(null);

	useEffect(() => {
		focused.current = isFocused;
		if (isFocused && pending.current) {
			showError(pending.current);
			pending.current = null;
		}
		return () => {
			focused.current = false;
		};
	}, [isFocused]);

	return useCallback((message: string) => {
		if (focused.current) showError(message);
		else pending.current = message;
	}, []);
}
