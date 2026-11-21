import { logger } from '@/shared/logging/logger';

export function silenceLogger(): void {
	jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
}
