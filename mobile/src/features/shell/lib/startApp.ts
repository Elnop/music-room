import { onBackendError } from '@/shared/backend/lib/backendErrors';
import { logger } from '@/shared/logging/logger';
import { restoreRedirectedPath } from '@/features/shell/lib/webBasePath';

export function startApp(): void {
	onBackendError((level, message, context) => logger[level](message, context));
	restoreRedirectedPath();
}
