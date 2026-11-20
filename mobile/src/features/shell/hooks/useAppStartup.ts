import { useEffect, useState } from 'react';
import { loadBackendUrl } from '@/shared/backend/lib/backendUrl';
import { logger } from '@/shared/logging/logger';

export function useAppStartup(loadSession: () => Promise<void>): boolean {
	const [ready, setReady] = useState(false);
	useEffect(() => {
		loadBackendUrl()
			.then(loadSession)
			.catch((error: Error) => {
				logger.error('Failed to load auth state:', error);
			})
			.finally(() => {
				setReady(true);
			});
	}, [loadSession]);
	return ready;
}
