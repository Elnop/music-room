import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '@/shared/config/env.js';
import { logger } from '@/shared/utils/logger.js';
import type { ApiResponse } from '@/shared/types/global.types.js';

interface AppErrorOptions {
	why?: string;
	fix?: string;
}

export class AppError extends Error {
	public why?: string;
	public fix?: string;

	constructor(
		public statusCode: number,
		message: string,
		public code?: string,
		public details?: unknown,
		options: AppErrorOptions = {}
	) {
		super(message);
		this.name = 'AppError';
		this.why = options.why;
		this.fix = options.fix;
		Error.captureStackTrace(this, this.constructor);
	}
}

function buildErrorResponse(err: AppError): ApiResponse {
	const exposeDebug = env.NODE_ENV === 'development' || env.NODE_ENV === 'test';
	return {
		success: false,
		error: {
			message: err.message,
			code: err.code,
			...(err.details !== undefined && { details: err.details }),
			...(exposeDebug && err.why !== undefined && { why: err.why }),
			...(exposeDebug && err.fix !== undefined && { fix: err.fix }),
		},
		meta: { timestamp: new Date().toISOString() },
	};
}

export function sendError(req: Request, res: Response, err: AppError, cause?: Error): void {
	const entry = {
		status: err.statusCode,
		code: err.code,
		error: (cause ?? err).message,
		why: err.why,
		fix: err.fix,
		path: req.path,
		method: req.method,
		...(err.statusCode >= 500 && { stack: (cause ?? err).stack }),
	};
	if (err.statusCode >= 500) logger.error('Request failed', entry);
	else logger.warn('Request rejected', entry);

	res.status(err.statusCode).json(buildErrorResponse(err));
}

function toAppError(err: Error): AppError {
	if (err instanceof AppError) return err;
	if (err instanceof ZodError) {
		return new AppError(
			400,
			'Validation error',
			'VALIDATION_ERROR',
			err.issues.map(e => ({ path: e.path.join('.'), message: e.message }))
		);
	}
	if ('code' in err && 'message' in err) {
		return new AppError(400, err.message, (err as Error & { code: string }).code);
	}
	return new AppError(500, 'Internal server error', 'INTERNAL_ERROR', undefined, {
		why: err.message,
	});
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
	sendError(req, res, toAppError(err), err);
}
