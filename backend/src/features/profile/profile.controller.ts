import type { Request, Response } from 'express';
import * as profileService from '@/features/profile/services/profile.service.js';
import * as profileSearchService from '@/features/profile/services/profile-search.service.js';
import * as filteredProfileService from '@/features/profile/services/filtered-profile.service.js';
import * as recommendationsService from '@/features/profile/services/recommendations.service.js';
import {
	recommendationsQuerySchema,
	searchUsersSchema,
	updateProfileSchema,
} from '@/features/profile/profile.validators.js';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { routeParam } from '@/shared/utils/route-params.js';
import { sendSuccess } from '@/shared/utils/send-success.js';

export async function getOwnProfile(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	sendSuccess(res, await profileService.getProfile(userId));
}

export async function updateProfile(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const validated = updateProfileSchema.parse(req.body);
	sendSuccess(res, await profileService.updateProfile(userId, validated));
}

export async function searchUsers(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const { q, limit } = searchUsersSchema.parse(req.query);
	sendSuccess(res, await profileSearchService.searchUsers(q, limit, userId));
}

export async function getRecommendations(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const { limit } = recommendationsQuerySchema.parse(req.query);
	sendSuccess(res, await recommendationsService.getRecommendations(userId, limit));
}

export async function getProfile(req: Request, res: Response) {
	const viewerId = (req as AuthenticatedRequest).user.id;
	const userId = routeParam(req, 'userId');
	sendSuccess(res, await filteredProfileService.getFilteredProfile(viewerId, userId));
}
