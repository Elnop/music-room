import type { Request } from 'express';
import { z } from 'zod';

/**
 * Route parameter readers.
 *
 * Express 5 types each `req.params` value as `string | string[]` (wildcard
 * segments are arrays). These helpers validate a named segment with Zod, so a
 * malformed value becomes a 400 VALIDATION_ERROR naming the parameter.
 */

/** Required parameter, e.g. `routeParam(req, 'id')` for `/:id`. */
export function routeParam(req: Request, name: string): string {
	return z.object({ [name]: z.string().min(1) }).parse(req.params)[name];
}
