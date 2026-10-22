import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
	playlistMemberSchema,
	viewersSchema,
} from '@/features/playlists/playlist-responses.validators.js';
import {
	addCollaboratorSchema,
	addViewerSchema,
	playlistIdParamSchema,
	playlistMemberParamsSchema,
} from '@/features/playlists/playlist.validators.js';
import {
	bearerAuth,
	jsonBody,
	nameSchemas,
	ok,
	okMessage,
} from '@/shared/config/swagger.schemas.js';
import { shared } from '@/shared/config/swagger.errors.js';

/** Registers the collaborator and viewer routes of /api/playlists; owner only. */
export function registerPlaylistSharingOpenapi(registry: OpenAPIRegistry): void {
	const common = { tags: ['Collaborators'], security: bearerAuth };
	nameSchemas({
		PlaylistMember: playlistMemberSchema,
		AddCollaboratorRequest: addCollaboratorSchema,
		AddViewerRequest: addViewerSchema,
	});
	const ownerOnly = {
		401: shared('UnauthorizedError'),
		403: shared('ForbiddenError'),
		404: shared('NotFoundError'),
	};
	const added = { ...ownerOnly, 400: shared('ValidationError') };

	registry.registerPath({
		...common,
		method: 'post',
		path: '/api/playlists/{id}/collaborators',
		summary: 'Add collaborator to playlist',
		description: 'Grants edit permissions to another user. Owner only.',
		operationId: 'addCollaborator',
		request: { params: playlistIdParamSchema, body: jsonBody(addCollaboratorSchema) },
		responses: {
			201: okMessage('Collaborator added', 'Collaborator added successfully'),
			...added,
		},
	});

	registry.registerPath({
		...common,
		method: 'delete',
		path: '/api/playlists/{id}/collaborators/{userId}',
		summary: 'Remove collaborator from playlist',
		description: 'Revokes edit permissions from a collaborator. Owner only.',
		operationId: 'removeCollaborator',
		request: { params: playlistMemberParamsSchema },
		responses: {
			200: okMessage('Collaborator removed', 'Collaborator removed successfully'),
			...ownerOnly,
		},
	});

	registry.registerPath({
		...common,
		method: 'get',
		path: '/api/playlists/{id}/viewers',
		summary: 'Get all viewers of a playlist',
		description:
			'Returns list of users who have view-only access to this private playlist. Owner only.',
		operationId: 'getViewers',
		request: { params: playlistIdParamSchema },
		responses: { 200: ok('Viewers retrieved', viewersSchema), ...ownerOnly },
	});

	registry.registerPath({
		...common,
		method: 'post',
		path: '/api/playlists/{id}/viewers',
		summary: 'Add viewer to playlist',
		description: 'Grants view-only access to a private playlist. Owner only.',
		operationId: 'addViewer',
		request: { params: playlistIdParamSchema, body: jsonBody(addViewerSchema) },
		responses: { 201: okMessage('Viewer added', 'Viewer added successfully'), ...added },
	});

	registry.registerPath({
		...common,
		method: 'delete',
		path: '/api/playlists/{id}/viewers/{userId}',
		summary: 'Remove viewer from playlist',
		description: 'Revokes view-only access from a viewer. Owner only.',
		operationId: 'removeViewer',
		request: { params: playlistMemberParamsSchema },
		responses: { 200: okMessage('Viewer removed', 'Viewer removed successfully'), ...ownerOnly },
	});
}
