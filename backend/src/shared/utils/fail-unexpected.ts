import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';

/** An AppError passes through; any other error is logged as `log` and answered as a 500. */
export async function failUnexpected<T>(
	work: () => Promise<T>,
	log: string,
	message: string,
	code: string
): Promise<T> {
	try {
		return await work();
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error(log, { error });
		throw new AppError(500, message, code);
	}
}
