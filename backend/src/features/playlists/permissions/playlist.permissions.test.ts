import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlaylistRow } from '@/features/playlists/playlist.types.js';

const { single } = vi.hoisted(() => ({ single: vi.fn() }));

vi.mock('@/shared/config/supabase.js', () => {
	const query = { select: () => query, eq: () => query, single };
	return { supabaseAdmin: { from: () => query } };
});

const { canViewPlaylist, canEditPlaylist, checkEditPermission } = await import(
	'@/features/playlists/permissions/playlist.permissions.js'
);

const OWNER = 'owner-id';
const COLLABORATOR = 'collaborator-id';
const VIEWER = 'viewer-id';
const STRANGER = 'stranger-id';

function playlist(
	visibility: 'public' | 'private',
	editMode: 'open' | 'restricted'
): PlaylistRow {
	return {
		id: 'playlist-id',
		name: 'Playlist',
		description: null,
		cover_url: null,
		owner_id: OWNER,
		visibility,
		edit_mode: editMode,
		collaborator_ids: [COLLABORATOR],
		viewer_ids: [VIEWER],
		created_at: null,
		updated_at: null,
	};
}

// Permission matrix documented in playlist.permissions.ts
describe('canViewPlaylist', () => {
	it.each([
		['public', 'open', [OWNER, COLLABORATOR, VIEWER, STRANGER], []],
		['public', 'restricted', [OWNER, COLLABORATOR, VIEWER, STRANGER], []],
		['private', 'open', [OWNER, COLLABORATOR, VIEWER], [STRANGER]],
		['private', 'restricted', [OWNER, COLLABORATOR, VIEWER], [STRANGER]],
	] as const)('%s/%s', (visibility, editMode, allowed, denied) => {
		const p = playlist(visibility, editMode);
		for (const user of allowed) expect(canViewPlaylist(p, user), user).toBe(true);
		for (const user of denied) expect(canViewPlaylist(p, user), user).toBe(false);
	});

	it('treats null member lists as empty', () => {
		const p = { ...playlist('private', 'open'), collaborator_ids: null, viewer_ids: null };
		expect(canViewPlaylist(p, OWNER)).toBe(true);
		expect(canViewPlaylist(p, VIEWER)).toBe(false);
	});
});

describe('canEditPlaylist', () => {
	it.each([
		['public', 'open', [OWNER, COLLABORATOR, VIEWER, STRANGER], []],
		['public', 'restricted', [OWNER, COLLABORATOR], [VIEWER, STRANGER]],
		['private', 'open', [OWNER, COLLABORATOR, VIEWER], [STRANGER]],
		['private', 'restricted', [OWNER, COLLABORATOR], [VIEWER, STRANGER]],
	] as const)('%s/%s', (visibility, editMode, allowed, denied) => {
		const p = playlist(visibility, editMode);
		for (const user of allowed) expect(canEditPlaylist(p, user), user).toBe(true);
		for (const user of denied) expect(canEditPlaylist(p, user), user).toBe(false);
	});
});

describe('checkEditPermission', () => {
	beforeEach(() => {
		single.mockReset();
	});

	it('resolves when the user can edit', async () => {
		single.mockResolvedValue({ data: playlist('public', 'restricted'), error: null });
		await expect(checkEditPermission('playlist-id', COLLABORATOR)).resolves.toBeUndefined();
	});

	it('rejects when the user cannot edit', async () => {
		single.mockResolvedValue({ data: playlist('public', 'restricted'), error: null });
		await expect(checkEditPermission('playlist-id', STRANGER)).rejects.toMatchObject({
			statusCode: 403,
			code: 'PLAYLIST_ACCESS_DENIED',
		});
	});

	it('rejects when the playlist does not exist', async () => {
		single.mockResolvedValue({ data: null, error: { message: 'not found' } });
		await expect(checkEditPermission('playlist-id', OWNER)).rejects.toMatchObject({
			statusCode: 404,
			code: 'PLAYLIST_NOT_FOUND',
		});
	});
});
