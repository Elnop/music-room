import type { Request } from 'express';

// Mirrors express-rate-limit's RateLimitInfo.
interface RateLimitInfo {
	limit: number;
	used: number;
	remaining: number;
	resetTime: Date | undefined;
	key: string;
}

declare module 'express-serve-static-core' {
	interface Request {
		rateLimit?: RateLimitInfo;
	}
}

export interface ActionLogContext {
	platform?: string;
	device?: string;
	appVersion?: string;
}

export interface AuthenticatedRequest extends Request {
	user: {
		id: string;
		email: string;
		role?: string;
	};
	actionLogContext?: ActionLogContext;
}

export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: {
		message: string;
		code?: string;
		details?: unknown;
		why?: string;
		fix?: string;
	};
	meta?: {
		timestamp: string;
		requestId?: string;
	};
}
