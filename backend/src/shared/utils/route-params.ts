import type { Request } from 'express';
import { z } from 'zod';

// Express 5 types each `req.params` value as `string | string[]`.

export function routeParam(req: Request, name: string): string {
	return z.object({ [name]: z.string().min(1) }).parse(req.params)[name];
}
