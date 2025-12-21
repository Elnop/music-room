import { Router } from "express";
import { musicControlController } from "./music-control.controller.js";
import { authMiddleware } from "@/features/auth/auth.middleware.js";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/music-control/permissions
 * Get list of users that I have granted control to
 */
router.get("/permissions", (req, res, next) =>
  musicControlController.getMyPermissions(req, res, next)
);

/**
 * POST /api/music-control/permissions/:userId
 * Grant control permission to a friend
 */
router.post("/permissions/:userId", (req, res, next) =>
  musicControlController.grantControl(req, res, next)
);

/**
 * DELETE /api/music-control/permissions/:userId
 * Revoke control permission from a user
 */
router.delete("/permissions/:userId", (req, res, next) =>
  musicControlController.revokeControl(req, res, next)
);

/**
 * GET /api/music-control/can-control/:userId
 * Check if the target user has granted me control
 */
router.get("/can-control/:userId", (req, res, next) =>
  musicControlController.checkCanControl(req, res, next)
);

export default router;
