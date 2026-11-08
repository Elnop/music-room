import type { Request } from 'express';
import { z } from 'zod';

export function routeParam(req: Request, name: string): string {
	return z.object({ [name]: z.string().min(1) }).parse(req.params)[name];
}
