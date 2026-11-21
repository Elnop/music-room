import { useEffect } from 'react';
import { logger } from '@/shared/logging/logger';

export function useLoadErrorLog(error: unknown, message: string): void {
	useEffect(() => {
		if (error) logger.error(message, error);
	}, [error, message]);
}
