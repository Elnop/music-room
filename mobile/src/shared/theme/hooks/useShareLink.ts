import { useCallback } from 'react';
import { Share } from 'react-native';
import { showError } from '@/shared/theme/lib/toast';

/** No success toast: the sheet is the feedback, and Android reports a dismissal as sharedAction. */
export function useShareLink(url: string, title?: string): () => Promise<void> {
	return useCallback(async () => {
		try {
			await Share.share({ message: title ? `${title}\n${url}` : url, title });
		} catch {
			showError('Impossible de partager ce lien');
		}
	}, [url, title]);
}
