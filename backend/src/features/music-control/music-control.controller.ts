import type { Request, Response, NextFunction } from "express";
import type {
  AuthenticatedRequest,
  ApiResponse,
} from "@/shared/types/global.types.js";
import { musicControlService } from "@/features/music-control/music-control.service.js";
import { AppError } from "@/shared/middleware/error-handler.js";

// UUID v4 validation regex
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Music Control Controller
 */
export class MusicControlController {
  /**
   * GET /api/music-control/permissions
   * Get list of users that I have granted control to
   */
  async getMyPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const allowedUserIds =
        await musicControlService.getGrantedPermissions(userId);

      const response: ApiResponse = {
        success: true,
        data: { allowedUserIds },
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
   * POST /api/music-control/permissions/:userId
   * Grant control permission to a friend
   */
  async grantControl(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const ownerId = authReq.user.id;
      const allowedUserId = req.params.userId;

      if (!isValidUuid(allowedUserId)) {
        throw new AppError(400, "Invalid user ID format", "INVALID_USER_ID");
      }

      await musicControlService.grantControl(ownerId, allowedUserId);

      const response: ApiResponse = {
        success: true,
        data: { success: true, allowedUserId },
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
   * DELETE /api/music-control/permissions/:userId
   * Revoke control permission from a user
   */
  async revokeControl(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const ownerId = authReq.user.id;
      const allowedUserId = req.params.userId;

      if (!isValidUuid(allowedUserId)) {
        throw new AppError(400, "Invalid user ID format", "INVALID_USER_ID");
      }

      await musicControlService.revokeControl(ownerId, allowedUserId);

      const response: ApiResponse = {
        success: true,
        data: { success: true, allowedUserId },
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
   * GET /api/music-control/can-control/:userId
   * Check if the target user has granted me control
   */
  async checkCanControl(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const myUserId = authReq.user.id;
      const targetUserId = req.params.userId;

      if (!isValidUuid(targetUserId)) {
        throw new AppError(400, "Invalid user ID format", "INVALID_USER_ID");
      }

      const canControl = await musicControlService.canControl(
        myUserId,
        targetUserId,
      );

      const response: ApiResponse = {
        success: true,
        data: { canControl, targetUserId },
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

export const musicControlController = new MusicControlController();
