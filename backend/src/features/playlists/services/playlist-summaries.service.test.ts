import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlaylistRow } from '@/features/playlists/playlist.types.js';

// Each supabaseAdmin.from(...) chain resolves to the next queued response.
const { responses, from } = vi.hoisted(() => {
	const responses: Array<{ data: unknown; error: unknown }> = [];
	const from = vi.fn(() => {
		const response = responses.shift();
		const chain: Record<string, unknown> = {};
		for (const method of ['select', 'in', 'order']) chain[method] = () => chain;
		chain.then = (resolve: (value: unknown) => unknown) => resolve(response);
		return chain;
	});
	return { responses, from };
});
vi.mock('@/shared/config/supabase.js', () => ({ supabaseAdmin: { from } }));

const { fetchTrackStats, summarizeWithOwners } =
	await import('@/features/playlists/services/playlist-summaries.service.js');
const { toOwner } = await import('@/features/playlists/utils/playlist.helpers.js');

const row = (id: string, ownerId: string) =>
	({
		id,
		name: id,
		owner_id: ownerId,
		description: null,
		cover_url: null,
		collaborator_ids: null,
		viewer_ids: null,
		visibility: 'public',
		edit_mode: 'open',
		created_at: '2026-01-01T00:00:00.000Z',
		updated_at: '2026-01-01T00:00:00.000Z',
	}) as unknown as PlaylistRow;

beforeEach(() => {
	responses.length = 0;
	from.mockClear();
});

describe('fetchTrackStats', () => {
	it('counts the tracks and keeps the first cover by rank', async () => {
		responses.push(
			{ data: [{ playlist_id: 'a' }, { playlist_id: 'a' }, { playlist_id: 'b' }], error: null },
			{
				data: [
					{ playlist_id: 'a', tracks: null },
					{ playlist_id: 'a', tracks: { album_art: 'https://img/a2' } },
					{ playlist_id: 'a', tracks: { album_art: 'https://img/a3' } },
					{ playlist_id: 'b', tracks: { album_art: 'https://img/b1' } },
				],
				error: null,
			}
		);

		await expect(fetchTrackStats(['a', 'b'])).resolves.toEqual({
			counts: { a: 2, b: 1 },
			firstCovers: { a: 'https://img/a2', b: 'https://img/b1' },
		});
	});

	it('throws the database error', async () => {
		const error = { message: 'down' };
		responses.push({ data: null, error });

		await expect(fetchTrackStats(['a'])).rejects.toBe(error);
	});
});

describe('summarizeWithOwners', () => {
	it('answers [] without querying when there is no playlist', async () => {
		await expect(summarizeWithOwners([])).resolves.toEqual([]);
		expect(from).not.toHaveBeenCalled();
	});

	it('attaches each playlist its track count, cover and owner', async () => {
		responses.push(
			{ data: [{ playlist_id: 'a' }], error: null },
			{ data: [], error: null },
			{
				data: [{ id: 'u1', username: 'one', display_name: null, avatar_url: 'https://img/u1' }],
				error: null,
			}
		);

		const [summary] = await summarizeWithOwners([row('a', 'u1')]);

		expect(summary).toMatchObject({
			id: 'a',
			trackCount: 1,
			firstTrackCover: undefined,
			owner: { id: 'u1', username: 'one', displayName: undefined, avatarUrl: 'https://img/u1' },
		});
	});
});

describe('toOwner', () => {
	it('maps null profile fields to undefined', () => {
		expect(toOwner({ id: 'u', username: 'n', display_name: null, avatar_url: null })).toEqual({
			id: 'u',
			username: 'n',
			displayName: undefined,
			avatarUrl: undefined,
		});
	});
});
