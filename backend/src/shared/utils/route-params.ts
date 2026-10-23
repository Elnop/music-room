import type { Request } from 'express';
import { z } from 'zod';

// Express 5 types each `req.params` value as `string | string[]`: a malformed one becomes a 400 VALIDATION_ERROR.

export function routeParam(req: Request, name: string): string {
	return z.object({ [name]: z.string().min(1) }).parse(req.params)[name];
}
