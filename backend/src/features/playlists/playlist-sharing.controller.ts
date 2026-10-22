import type { Request, Response } from 'express';
import * as collaboratorService from '@/features/playlists/services/collaborator.service.js';
import * as viewerService from '@/features/playlists/services/viewer.service.js';
import * as viewerListService from '@/features/playlists/services/viewer-list.service.js';
import {
	addCollaboratorSchema,
	addViewerSchema,
} from '@/features/playlists/playlist.validators.js';
import type { AuthenticatedRequest } from '@/shared/types/global.types.js';
import { routeParam } from '@/shared/utils/route-params.js';
import { sendSuccess } from '@/shared/utils/send-success.js';

// Playlist sharing: collaborators and viewers, managed by the owner.

/** POST /api/playlists/:id/collaborators */
export async function addCollaborator(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const id = routeParam(req, 'id');
	const validated = addCollaboratorSchema.parse(req.body);
	await collaboratorService.addCollaborator(id, userId, validated.userId);
	sendSuccess(res, { message: 'Collaborator added successfully' }, 201);
}

/** DELETE /api/playlists/:id/collaborators/:userId */
export async function removeCollaborator(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const id = routeParam(req, 'id');
	const collaboratorId = routeParam(req, 'userId');
	await collaboratorService.removeCollaborator(id, userId, collaboratorId);
	sendSuccess(res, { message: 'Collaborator removed successfully' });
}

/** GET /api/playlists/:id/viewers */
export async function getViewers(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const id = routeParam(req, 'id');
	sendSuccess(res, { viewers: await viewerListService.getViewers(id, userId) });
}

/** POST /api/playlists/:id/viewers */
export async function addViewer(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const id = routeParam(req, 'id');
	const validated = addViewerSchema.parse(req.body);
	await viewerService.addViewer(id, userId, validated.userId);
	sendSuccess(res, { message: 'Viewer added successfully' }, 201);
}

/** DELETE /api/playlists/:id/viewers/:userId */
export async function removeViewer(req: Request, res: Response) {
	const userId = (req as AuthenticatedRequest).user.id;
	const id = routeParam(req, 'id');
	const viewerId = routeParam(req, 'userId');
	await viewerService.removeViewer(id, userId, viewerId);
	sendSuccess(res, { message: 'Viewer removed successfully' });
}
