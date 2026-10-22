import type { Request } from 'express';

/** Client IP of a request, as the rate limiters see it (rate-limit.middleware.ts). */
export function requestIp(req: Request): string {
	return req.ip || req.socket?.remoteAddress || 'unknown';
}
