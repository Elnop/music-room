import { useCallback } from 'react';
import { Share } from 'react-native';
import { logger } from '@/shared/utils/logger';
import { showError } from '@/shared/utils/toast';

export function useShareLink(url: string, title?: string): () => Promise<void> {
	return useCallback(async () => {
		try {
			await Share.share({ message: title ? `${title}\n${url}` : url, title });
		} catch (error) {
			logger.error('[Share] Share failed:', error);
			showError('Impossible de partager ce lien');
		}
	}, [url, title]);
}
