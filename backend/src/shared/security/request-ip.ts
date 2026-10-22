import type { Request } from 'express';

/** Client IP of a request, as the rate limiters and lockout see it (http-rate-limit.ts). */
export function requestIp(req: Request): string {
	return req.ip || req.socket?.remoteAddress || 'unknown';
}
