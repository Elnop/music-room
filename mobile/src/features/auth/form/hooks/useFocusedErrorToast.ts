import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { showError } from '@/shared/utils/toast';

/**
 * An error toast shown only while the screen is focused: a failure that ends
 * while another screen is on top waits until this one is back; one that ends
 * after the screen unmounted is dropped.
 */
export function useFocusedErrorToast(): (message: string) => void {
	const isFocused = useIsFocused();
	const [pending, setPending] = useState<string | null>(null);

	useEffect(() => {
		if (pending && isFocused) {
			showError(pending);
			setPending(null);
		}
	}, [pending, isFocused]);

	return setPending;
}
