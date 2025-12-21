import type { Request, Response, NextFunction } from "express";
import { ProfileService } from "./profile.service.js";
import {
  updateProfileSchema,
  searchUsersSchema,
} from "./profile.validators.js";
import type { AuthenticatedRequest } from "@/shared/types/global.types.js";
import type { ApiResponse } from "@/shared/types/global.types.js";

const profileService = new ProfileService();

export class ProfileController {
  /**
   * Update user profile
   * PATCH /api/profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const validated = updateProfileSchema.parse(req.body);

      const profile = await profileService.updateProfile(
        authReq.user.id,
        validated
      );

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
   * Get user profile by ID
   * GET /api/profile/:userId
   */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      const profile = await profileService.getProfile(userId);

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

      const users = await profileService.searchUsers(
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
}
