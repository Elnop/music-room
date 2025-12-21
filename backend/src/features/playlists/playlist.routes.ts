import { Router } from "express";
import { PlaylistController } from "./playlist.controller.js";
import { authMiddleware } from "@/features/auth/auth.middleware.js";

const router = Router();
const playlistController = new PlaylistController();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/playlists
 * @desc    Get user's playlists (owned + collaborating)
 * @access  Private
 */
router.get("/", (req, res, next) =>
  playlistController.getUserPlaylists(req, res, next),
);

/**
 * @route   POST /api/playlists
 * @desc    Create new playlist
 * @access  Private
 */
router.post("/", (req, res, next) =>
  playlistController.createPlaylist(req, res, next),
);

/**
 * @route   GET /api/playlists/user/:userId
 * @desc    Get public playlists of a specific user
 * @access  Private
 */
router.get("/user/:userId", (req, res, next) =>
  playlistController.getPublicPlaylistsByUser(req, res, next),
);

/**
 * @route   GET /api/playlists/:id
 * @desc    Get playlist by ID with tracks
 * @access  Private
 */
router.get("/:id", (req, res, next) =>
  playlistController.getPlaylistById(req, res, next),
);

/**
 * @route   PATCH /api/playlists/:id
 * @desc    Update playlist metadata
 * @access  Private (owner only)
 */
router.patch("/:id", (req, res, next) =>
  playlistController.updatePlaylist(req, res, next),
);

/**
 * @route   DELETE /api/playlists/:id
 * @desc    Delete playlist
 * @access  Private (owner only)
 */
router.delete("/:id", (req, res, next) =>
  playlistController.deletePlaylist(req, res, next),
);

/**
 * @route   POST /api/playlists/:id/tracks
 * @desc    Add track to playlist
 * @access  Private (owner + collaborators)
 */
router.post("/:id/tracks", (req, res, next) =>
  playlistController.addTrack(req, res, next),
);

/**
 * @route   DELETE /api/playlists/:id/tracks/:trackId
 * @desc    Remove track from playlist
 * @access  Private (owner + collaborators)
 */
router.delete("/:id/tracks/:trackId", (req, res, next) =>
  playlistController.removeTrack(req, res, next),
);

/**
 * @route   PUT /api/playlists/:id/tracks/reorder
 * @desc    Reorder tracks in playlist
 * @access  Private (owner + collaborators)
 */
router.put("/:id/tracks/reorder", (req, res, next) =>
  playlistController.reorderTracks(req, res, next),
);

/**
 * @route   POST /api/playlists/:id/collaborators
 * @desc    Add collaborator to playlist
 * @access  Private (owner only)
 */
router.post("/:id/collaborators", (req, res, next) =>
  playlistController.addCollaborator(req, res, next),
);

/**
 * @route   DELETE /api/playlists/:id/collaborators/:userId
 * @desc    Remove collaborator from playlist
 * @access  Private (owner only)
 */
router.delete("/:id/collaborators/:userId", (req, res, next) =>
  playlistController.removeCollaborator(req, res, next),
);

export default router;
