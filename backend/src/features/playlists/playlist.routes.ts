import { Router } from 'express';
import * as playlists from '@/features/playlists/playlist.controller.js';
import * as tracks from '@/features/playlists/playlist-tracks.controller.js';
import * as sharing from '@/features/playlists/playlist-sharing.controller.js';
import { authMiddleware } from '@/features/auth/auth.middleware.js';

// Endpoints are documented in playlist*.openapi.ts.
const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/', playlists.getUserPlaylists);
router.post('/', playlists.createPlaylist);
router.get('/public', playlists.getPublicPlaylists);
router.get('/user/:userId', playlists.getPlaylistsByUser);
router.get('/:id', playlists.getPlaylistById);
router.patch('/:id', playlists.updatePlaylist);
router.delete('/:id', playlists.deletePlaylist);

router.post('/:id/tracks', tracks.addTrack);
router.delete('/:id/tracks/:trackId', tracks.removeTrack);
router.post('/:id/tracks/:trackId/move', tracks.moveTrack);

router.post('/:id/collaborators', sharing.addCollaborator);
router.delete('/:id/collaborators/:userId', sharing.removeCollaborator);
router.get('/:id/viewers', sharing.getViewers);
router.post('/:id/viewers', sharing.addViewer);
router.delete('/:id/viewers/:userId', sharing.removeViewer);

export default router;
