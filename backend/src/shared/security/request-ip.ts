import type { Request } from 'express';

/** As the rate limiters and lockout see it. */
export function requestIp(req: Request): string {
	return req.ip || req.socket?.remoteAddress || 'unknown';
}
