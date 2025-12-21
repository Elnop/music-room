import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { authMiddleware } from "./auth.middleware.js";

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

export default router;
