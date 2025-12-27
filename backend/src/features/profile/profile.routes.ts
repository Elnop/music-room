import { Router } from "express";
import { authMiddleware } from "../auth/auth.middleware.js";
import { ProfileController } from "./profile.controller.js";

const router = Router();
const controller = new ProfileController();

/**
 * All profile routes require authentication
 */
router.use(authMiddleware);

// =====================================================
// Profile Routes
// =====================================================

/**
 * @route   PATCH /api/profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.patch("/", (req, res, next) => controller.updateProfile(req, res, next));

/**
 * @route   GET /api/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get("/", (req, res, next) => controller.getOwnProfile(req, res, next));

/**
 * @route   GET /api/profile/search
 * @desc    Search users by username or display name
 * @access  Private
 * @query   q - Search query (required)
 * @query   limit - Max results (default: 20, max: 50)
 */
router.get("/search", (req, res, next) =>
  controller.searchUsers(req, res, next)
);

// =====================================================
// Privacy Routes
// =====================================================

/**
 * @route   GET /api/profile/privacy
 * @desc    Get current user's privacy settings
 * @access  Private
 */
router.get("/privacy", (req, res, next) =>
  controller.getPrivacySettings(req, res, next)
);

/**
 * @route   PUT /api/profile/privacy
 * @desc    Update current user's privacy settings
 * @access  Private
 */
router.put("/privacy", (req, res, next) =>
  controller.updatePrivacySettings(req, res, next)
);

// =====================================================
// Music Preferences Routes
// =====================================================

/**
 * @route   GET /api/profile/music-preferences
 * @desc    Get current user's music preferences
 * @access  Private
 */
router.get("/music-preferences", (req, res, next) =>
  controller.getMusicPreferences(req, res, next)
);

/**
 * @route   PUT /api/profile/music-preferences
 * @desc    Update current user's music preferences (max 5 genres)
 * @access  Private
 */
router.put("/music-preferences", (req, res, next) =>
  controller.updateMusicPreferences(req, res, next)
);

/**
 * @route   GET /api/profile/music-preferences/genres
 * @desc    Get all available music genres
 * @access  Private
 */
router.get("/music-preferences/genres", (req, res, next) =>
  controller.getAvailableGenres(req, res, next)
);

// =====================================================
// User Profile Routes (by ID)
// =====================================================

/**
 * @route   GET /api/profile/:userId
 * @desc    Get user profile by ID (filtered by privacy settings)
 * @access  Private
 */
router.get("/:userId", (req, res, next) =>
  controller.getProfile(req, res, next)
);

export default router;
