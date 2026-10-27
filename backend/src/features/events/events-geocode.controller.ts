import type { Request, Response } from 'express';
import * as geocodeService from '@/features/events/services/geocode.service.js';
import { geocodeQuerySchema } from '@/features/events/events.validators.js';
import { sendSuccess } from '@/shared/utils/send-success.js';

export async function geocodeAddress(req: Request, res: Response) {
	const { q } = geocodeQuerySchema.parse(req.query);
	sendSuccess(res, { location: await geocodeService.geocodeAddress(q) });
}
