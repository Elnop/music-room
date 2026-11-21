import { useCallback } from 'react';
import { Share } from 'react-native';
import { showError } from '@/shared/theme/lib/toast';

export function useShareLink(url: string, title?: string): () => Promise<void> {
	return useCallback(async () => {
		try {
			await Share.share({ message: title ? `${title}\n${url}` : url, title });
		} catch {
			showError('Impossible de partager ce lien');
		}
	}, [url, title]);
}
