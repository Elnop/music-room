import { ApiError } from '@/shared/backend/lib/ApiError';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';

export function streamFailureMessage(err: unknown, timedOut: boolean): string {
	if (timedOut) {
		logger.error('🔴 [PlayerLoader] Fetch timeout!');
		return 'Chargement trop long, réessayez';
	}
	if (err instanceof ApiError && err.status === 404) return "Ce titre n'est plus disponible";
	if (err instanceof ApiError && err.status !== undefined && err.status >= 400) {
		logger.error('🔴 [PlayerLoader] Server error details:', err.message);
		return apiErrorMessage(err, 'Impossible de charger ce titre');
	}
	logger.error('🔴 [PlayerLoader] Error:', err instanceof Error ? err.message : err);
	return apiErrorMessage(err, 'Erreur de chargement du titre');
}
