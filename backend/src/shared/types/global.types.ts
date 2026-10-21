import type { Request } from 'express';

// RateLimitInfo type from express-rate-limit
interface RateLimitInfo {
	limit: number;
	used: number;
	remaining: number;
	resetTime: Date | undefined;
	key: string;
}

// Extend Express Request to include rateLimit info
declare module 'express-serve-static-core' {
	interface Request {
		rateLimit?: RateLimitInfo;
	}
}

/**
 * Action log context containing client metadata
 */
export interface ActionLogContext {
	platform?: string;
	device?: string;
	appVersion?: string;
}

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
	user: {
		id: string;
		email: string;
		role?: string;
	};
	actionLogContext?: ActionLogContext;
}

/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: {
		message: string;
		code?: string;
		details?: unknown;
		/** Technical reason; sent in development and test only. */
		why?: string;
		/** Hint to fix it; sent in development and test only. */
		fix?: string;
	};
	meta?: {
		timestamp: string;
		requestId?: string;
	};
}
