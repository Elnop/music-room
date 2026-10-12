import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/shared/middleware/error-handler.js';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock('@/shared/config/supabase.js', () => ({ supabaseAdmin: { rpc } }));

const { addTrackRpc, moveTrackRpc, removeTrackRpc } =
	await import('@/features/playlists/utils/track-rpc.js');

describe('track RPC wrappers', () => {
	beforeEach(() => rpc.mockReset());

	it('returns the parsed add result and omits a null adder', async () => {
		const result = {
			rank: 'h',
			tracksVersion: 1,
			addedAt: '2026-10-09T00:00:00Z',
			rebalanced: false,
		};
		rpc.mockResolvedValue({ data: result, error: null });
		await expect(addTrackRpc('p', 't', null)).resolves.toEqual(result);
		expect(rpc).toHaveBeenCalledWith('playlist_add_track', { p_playlist_id: 'p', p_track_id: 't' });
	});

	it('passes the adder when there is one', async () => {
		rpc.mockResolvedValue({
			data: { rank: 'h', tracksVersion: 1, addedAt: 'x', rebalanced: false },
			error: null,
		});
		await addTrackRpc('p', 't', 'u');
		expect(rpc).toHaveBeenCalledWith('playlist_add_track', {
			p_playlist_id: 'p',
			p_track_id: 't',
			p_added_by: 'u',
		});
	});

	it('returns the parsed move result', async () => {
		rpc.mockResolvedValue({
			data: { rank: 'l', tracksVersion: 11, rebalanced: false },
			error: null,
		});
		await expect(moveTrackRpc('p', 't', { afterRank: 'h', expectedVersion: 10 })).resolves.toEqual({
			rank: 'l',
			tracksVersion: 11,
			rebalanced: false,
		});
		expect(rpc).toHaveBeenCalledWith('playlist_move_track', {
			p_playlist_id: 'p',
			p_track_id: 't',
			p_expected_version: 10,
			p_after_rank: 'h',
		});
	});

	it('omits afterRank for a move to the top', async () => {
		rpc.mockResolvedValue({
			data: { rank: 'a', tracksVersion: 3, rebalanced: false },
			error: null,
		});
		await moveTrackRpc('p', 't', { afterRank: null, expectedVersion: 2 });
		expect(rpc).toHaveBeenCalledWith('playlist_move_track', {
			p_playlist_id: 'p',
			p_track_id: 't',
			p_expected_version: 2,
		});
	});

	it.each([
		['TRACK_MOVED_CONCURRENTLY', 409],
		['TRACK_NOT_IN_PLAYLIST', 409],
		['PLAYLIST_REBALANCED', 409],
		['PLAYLIST_NOT_FOUND', 404],
	])('maps move error %s to %i', async (code, status) => {
		rpc.mockResolvedValue({ data: null, error: { message: code } });
		const error = await moveTrackRpc('p', 't', { afterRank: null, expectedVersion: 0 }).catch(
			(e: unknown) => e
		);
		expect(error).toBeInstanceOf(AppError);
		expect(error).toMatchObject({ statusCode: status, code });
	});

	it.each([
		['TRACK_NOT_IN_PLAYLIST', 404],
		['PLAYLIST_NOT_FOUND', 404],
	])('maps remove error %s to %i', async (code, status) => {
		rpc.mockResolvedValue({ data: null, error: { message: code } });
		await expect(removeTrackRpc('p', 't')).rejects.toMatchObject({ statusCode: status, code });
	});

	it.each([
		['TRACK_DUPLICATE', 409],
		['PLAYLIST_NOT_FOUND', 404],
	])('maps add error %s to %i', async (code, status) => {
		rpc.mockResolvedValue({ data: null, error: { message: code } });
		await expect(addTrackRpc('p', 't', null)).rejects.toMatchObject({ statusCode: status, code });
	});

	it.each(['connection reset', 'toString'])(
		'turns an unknown database error (%s) into a 500',
		async message => {
			rpc.mockResolvedValue({ data: null, error: { message } });
			await expect(removeTrackRpc('p', 't')).rejects.toMatchObject({
				statusCode: 500,
				code: 'TRACK_OPERATION_ERROR',
			});
		}
	);

	it('rejects a malformed result', async () => {
		rpc.mockResolvedValue({ data: { tracksVersion: 'x' }, error: null });
		await expect(removeTrackRpc('p', 't')).rejects.toMatchObject({ statusCode: 500 });
	});
});
