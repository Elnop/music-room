import type { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/utils/logger.js';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';

export function actionLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
	const startTime = Date.now();

	const platform = req.get('X-Platform') || 'Unknown Platform';
	const device = req.get('X-Device-Model') || 'Unknown Device';
	const appVersion = req.get('X-App-Version') || '0.0.0';

	(req as AuthenticatedRequest).actionLogContext = {
		platform,
		device,
		appVersion,
	};

	logger.info('HTTP Request', {
		method: req.method,
		path: req.originalUrl,
		platform,
		device,
		appVersion,
		ip: req.ip,
		userAgent: req.get('user-agent'),
	});

	res.on('finish', () => {
		const responseTime = Date.now() - startTime;
		const userId = (req as AuthenticatedRequest).user?.id;

		logger.info('HTTP Response', {
			method: req.method,
			path: req.originalUrl,
			userId: userId || 'anonymous',
			status: res.statusCode,
			responseTime: `${responseTime}ms`,
			platform,
			device,
			appVersion,
		});
	});

	next();
}
