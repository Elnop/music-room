import { Router } from "express";
import { AuthController } from "@/features/auth/auth.controller.js";
import { authMiddleware } from "@/features/auth/auth.middleware.js";
import {
  loginRateLimiter,
  registerRateLimiter,
  oauthRateLimiter,
  globalAuthRateLimiter,
} from "@/features/auth/middleware/rate-limit.middleware.js";
import {
  checkAccountLockout,
  checkIPBlacklist,
} from "@/features/auth/middleware/account-lockout.middleware.js";

const router = Router();
const authController = new AuthController();

// Apply IP blacklist check to ALL auth routes (first line of defense)
router.use(checkIPBlacklist);

// Apply global rate limiter to ALL auth routes (safety net)
router.use(globalAuthRateLimiter);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", registerRateLimiter, (req, res, next) =>
  authController.register(req, res, next),
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user with email and password
 * @access  Public
 */
router.post(
  "/login",
  loginRateLimiter,
  checkAccountLockout,
  (req, res, next) => authController.login(req, res, next),
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public (no auth middleware - uses refresh token)
 */
router.post("/refresh", loginRateLimiter, (req, res, next) =>
  authController.refreshToken(req, res, next),
);

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
router.post("/google", oauthRateLimiter, (req, res, next) =>
  authController.googleLogin(req, res, next),
);

/**
 * @route   POST /api/auth/facebook
 * @desc    Login with Facebook OAuth
 * @access  Public
 */
router.post("/facebook", oauthRateLimiter, (req, res, next) =>
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

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with 6-digit code
 * @access  Public
 */
router.post("/verify-email", loginRateLimiter, (req, res, next) =>
  authController.verifyEmail(req, res, next),
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification code
 * @access  Public
 */
router.post("/resend-verification", registerRateLimiter, (req, res, next) =>
  authController.resendVerification(req, res, next),
);

export default router;
