import type { Request, Response, NextFunction } from 'express';
import { ProfileService } from '@/features/profile/services/profile.service.js';
import { ProfileSearchService } from '@/features/profile/services/profile-search.service.js';
import { PrivacyService } from '@/features/profile/services/privacy.service.js';
import { MusicPreferencesService } from '@/features/profile/services/music-preferences.service.js';
import { AvatarService } from '@/features/profile/services/avatar.service.js';
import {
	updateProfileSchema,
	searchUsersSchema,
	updatePrivacySchema,
	updateMusicPreferencesSchema,
	avatarFileSchema,
} from '@/features/profile/profile.validators.js';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import type { ApiResponse } from '@/shared/types/global.types.js';
import { routeParam } from '@/shared/utils/route-params.js';

const profileService = new ProfileService();
const profileSearchService = new ProfileSearchService();
const privacyService = new PrivacyService();
const musicPreferencesService = new MusicPreferencesService();
const avatarService = new AvatarService();

export class ProfileController {
	// =====================================================
	// Profile Methods
	// =====================================================

	/**
	 * Update user profile
	 * PATCH /api/profile
	 */
	async updateProfile(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const validated = updateProfileSchema.parse(req.body);

			const profile = await profileService.updateProfile(authReq.user.id, validated);

			const response: ApiResponse = {
				success: true,
				data: profile,
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.status(200).json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Replace the profile photo with the uploaded file (multipart field `avatar`)
	 * PUT /api/profile/avatar
	 */
	async uploadAvatar(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const file = avatarFileSchema.parse(req.file);

			const avatar = await avatarService.uploadAvatar(authReq.user.id, file.buffer);

			const response: ApiResponse = {
				success: true,
				data: avatar,
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.status(200).json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Remove the profile photo (back to initials)
	 * DELETE /api/profile/avatar
	 */
	async removeAvatar(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;

			const avatar = await avatarService.removeAvatar(authReq.user.id);

			const response: ApiResponse = {
				success: true,
				data: avatar,
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.status(200).json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Get user profile by ID (filtered by privacy settings)
	 * GET /api/profile/:userId
	 */
	async getProfile(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const userId = routeParam(req, 'userId');

			// Use privacy-filtered profile
			const profile = await privacyService.getFilteredProfile(authReq.user.id, userId);

			const response: ApiResponse = {
				success: true,
				data: profile,
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.status(200).json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Get current user's own profile
	 * GET /api/profile
	 */
	async getOwnProfile(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;

			const profile = await profileService.getProfile(authReq.user.id);

			const response: ApiResponse = {
				success: true,
				data: profile,
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.status(200).json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Search users by username or display name
	 * GET /api/profile/search?q=query&limit=20
	 */
	async searchUsers(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const validated = searchUsersSchema.parse(req.query);

			const users = await profileSearchService.searchUsers(
				validated.q,
				validated.limit,
				authReq.user.id // Exclude current user from results
			);

			const response: ApiResponse = {
				success: true,
				data: users,
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.status(200).json(response);
		} catch (error) {
			next(error);
		}
	}

	// =====================================================
	// Privacy Methods
	// =====================================================

	/**
	 * Get current user's privacy settings
	 * GET /api/profile/privacy
	 */
	async getPrivacySettings(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;

			const privacy = await privacyService.getPrivacySettings(authReq.user.id);

			const response: ApiResponse = {
				success: true,
				data: privacy,
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.status(200).json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Update current user's privacy settings
	 * PUT /api/profile/privacy
	 */
	async updatePrivacySettings(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const validated = updatePrivacySchema.parse(req.body);

			const privacy = await privacyService.updatePrivacySettings(authReq.user.id, validated);

			const response: ApiResponse = {
				success: true,
				data: privacy,
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.status(200).json(response);
		} catch (error) {
			next(error);
		}
	}

	// =====================================================
	// Music Preferences Methods
	// =====================================================

	/**
	 * Get current user's music preferences
	 * GET /api/profile/music-preferences
	 */
	async getMusicPreferences(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;

			const preferences = await musicPreferencesService.getMusicPreferences(authReq.user.id);

			const response: ApiResponse = {
				success: true,
				data: preferences,
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.status(200).json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Update current user's music preferences
	 * PUT /api/profile/music-preferences
	 */
	async updateMusicPreferences(req: Request, res: Response, next: NextFunction) {
		try {
			const authReq = req as AuthenticatedRequest;
			const validated = updateMusicPreferencesSchema.parse(req.body);

			const preferences = await musicPreferencesService.updateMusicPreferences(
				authReq.user.id,
				validated
			);

			const response: ApiResponse = {
				success: true,
				data: preferences,
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.status(200).json(response);
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Get all available music genres
	 * GET /api/profile/music-preferences/genres
	 */
	getAvailableGenres(req: Request, res: Response, next: NextFunction) {
		try {
			const genres = musicPreferencesService.getAvailableGenres();

			const response: ApiResponse = {
				success: true,
				data: { genres },
				meta: {
					timestamp: new Date().toISOString(),
				},
			};

			res.status(200).json(response);
		} catch (error) {
			next(error);
		}
	}
}
