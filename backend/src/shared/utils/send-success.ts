import type { Response } from 'express';
import type { ApiResponse } from '@/shared/types/global.types.js';

/** Answers with the API's success body: `{ success: true, data, meta }`. */
export function sendSuccess(res: Response, data: unknown, status = 200): void {
	const body: ApiResponse = { success: true, data, meta: { timestamp: new Date().toISOString() } };
	res.status(status).json(body);
}
