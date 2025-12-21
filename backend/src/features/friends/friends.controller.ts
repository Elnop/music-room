import type { Request, Response, NextFunction } from "express";
import { FriendsService } from "./friends.service.js";
import type { AuthenticatedRequest } from "@/shared/types/global.types.js";
import type { ApiResponse } from "@/shared/types/global.types.js";

const friendsService = new FriendsService();

export class FriendsController {
  async getFollowStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { userId } = req.params;

      const status = await friendsService.getFollowStatus(
        authReq.user.id,
        userId
      );

      const response: ApiResponse = {
        success: true,
        data: status,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async followUser(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { userId } = req.params;

      const result = await friendsService.followUser(authReq.user.id, userId);

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async unfollowUser(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { userId } = req.params;

      const result = await friendsService.unfollowUser(authReq.user.id, userId);

      const response: ApiResponse = {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getMutualFriends(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;

      const friends = await friendsService.getMutualFriends(authReq.user.id);

      const response: ApiResponse = {
        success: true,
        data: friends,
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
