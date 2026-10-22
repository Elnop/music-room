import type { Request, Response } from 'express';
import * as privacySettingsService from '@/features/profile/services/privacy-settings.service.js';
import * as musicPreferencesService from '@/features/profile/services/music-preferences.service.js';
import {
	updateMusicPreferencesSchema,
	updatePrivacySchema,
} from '@/features/profile/profile.validators.js';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { sendSuccess } from '@/shared/utils/send-success.js';

// Profile settings: privacy of each field, music preferences.

/** GET /api/profile/privacy */
export async function getPrivacySettings(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	sendSuccess(res, await privacySettingsService.getPrivacySettings(userId));
}

/** PUT /api/profile/privacy */
export async function updatePrivacySettings(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const validated = updatePrivacySchema.parse(req.body);
	sendSuccess(res, await privacySettingsService.updatePrivacySettings(userId, validated));
}

/** GET /api/profile/music-preferences */
export async function getMusicPreferences(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	sendSuccess(res, await musicPreferencesService.getMusicPreferences(userId));
}

/** PUT /api/profile/music-preferences (max 5 genres) */
export async function updateMusicPreferences(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const validated = updateMusicPreferencesSchema.parse(req.body);
	sendSuccess(res, await musicPreferencesService.updateMusicPreferences(userId, validated));
}

/** GET /api/profile/music-preferences/genres */
export function getAvailableGenres(_req: Request, res: Response) {
	sendSuccess(res, { genres: musicPreferencesService.getAvailableGenres() });
}
