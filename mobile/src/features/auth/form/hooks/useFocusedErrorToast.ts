import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { showError } from '@/shared/utils/toast';

/** A failure ending while another screen is on top waits for focus; one ending after unmount is dropped. */
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
