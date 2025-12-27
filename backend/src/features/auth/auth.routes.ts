import { Router } from "express";
import { AuthController } from "@/features/auth/auth.controller.js";
import { authMiddleware } from "@/features/auth/auth.middleware.js";

const router = Router();
const authController = new AuthController();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", (req, res, next) =>
  authController.register(req, res, next),
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user with email and password
 * @access  Public
 */
router.post("/login", (req, res, next) => authController.login(req, res, next));

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private (requires authentication)
 */
router.get("/me", authMiddleware, (req, res, next) =>
  authController.me(req, res, next),
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout current user
 * @access  Private (requires authentication)
 */
router.post("/logout", authMiddleware, (req, res, next) =>
  authController.logout(req, res, next),
);

/**
 * @route   POST /api/auth/google
 * @desc    Login with Google OAuth
 * @access  Public
 */
router.post("/google", (req, res, next) =>
  authController.googleLogin(req, res, next),
);

/**
 * @route   POST /api/auth/facebook
 * @desc    Login with Facebook OAuth
 * @access  Public
 */
router.post("/facebook", (req, res, next) =>
  authController.facebookLogin(req, res, next),
);

/**
 * @route   GET /api/auth/providers
 * @desc    Get list of linked authentication providers
 * @access  Private (requires authentication)
 */
router.get("/providers", authMiddleware, (req, res, next) =>
  authController.getLinkedProviders(req, res, next),
);

/**
 * @route   DELETE /api/auth/providers/:provider
 * @desc    Unlink an OAuth provider from the account
 * @access  Private (requires authentication)
 */
router.delete("/providers/:provider", authMiddleware, (req, res, next) =>
  authController.unlinkProvider(req, res, next),
);

export default router;
