import type { Request, Response } from 'express';
import * as privacySettingsService from '@/features/profile/services/privacy-settings.service.js';
import * as musicPreferencesService from '@/features/profile/services/music-preferences.service.js';
import {
	updateMusicPreferencesSchema,
	updatePrivacySchema,
} from '@/features/profile/profile.validators.js';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { sendSuccess } from '@/shared/utils/send-success.js';

export async function getPrivacySettings(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	sendSuccess(res, await privacySettingsService.getPrivacySettings(userId));
}

export async function updatePrivacySettings(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const validated = updatePrivacySchema.parse(req.body);
	sendSuccess(res, await privacySettingsService.updatePrivacySettings(userId, validated));
}

export async function getMusicPreferences(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	sendSuccess(res, await musicPreferencesService.getMusicPreferences(userId));
}

export async function updateMusicPreferences(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const validated = updateMusicPreferencesSchema.parse(req.body);
	sendSuccess(res, await musicPreferencesService.updateMusicPreferences(userId, validated));
}

export function getAvailableGenres(_req: Request, res: Response) {
	sendSuccess(res, { genres: musicPreferencesService.getAvailableGenres() });
}
