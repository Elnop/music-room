import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { assertPremium } from '@/shared/subscription/plan.js';
import {
	removeStoredImage,
	storedImagePath,
	storeImage,
} from '@/shared/storage/public-image.js';
import { checkOwnership } from '@/features/playlists/permissions/playlist.permissions.js';
import { toDetailsPayload } from '@/features/playlists/utils/playlist.helpers.js';
import * as realtime from '@/realtime/emitters/playlist.emitters.js';
import type { CoverResponse } from '@/features/playlists/playlist.types.js';

/** Public bucket, created by migration 031. */
export const COVER_BUCKET = 'playlist-covers';

/** Deletes the cover file when it was stored here for this playlist. Never throws. */
export async function deleteCoverFile(
	coverUrl: string | null | undefined,
	playlistId: string
): Promise<void> {
	const path = storedImagePath(coverUrl, COVER_BUCKET, playlistId);
	if (path) await removeStoredImage(COVER_BUCKET, path, { playlistId });
}

async function currentCoverUrl(playlistId: string): Promise<string | null> {
	const { data, error } = await supabaseAdmin
		.from('playlists')
		.select('cover_url')
		.eq('id', playlistId)
		.single();
	if (error || !data) throw new AppError(404, 'Playlist not found', 'PLAYLIST_NOT_FOUND');
	return data.cover_url;
}

/** Saves cover_url and tells the playlist's room through `playlist:details`. */
async function setCoverUrl(playlistId: string, coverUrl: string | null): Promise<void> {
	const { data, error } = await supabaseAdmin
		.from('playlists')
		.update({ cover_url: coverUrl, updated_at: new Date().toISOString() })
		.eq('id', playlistId)
		.select()
		.single();
	if (error || !data) {
		logger.error('Failed to save cover_url', { playlistId, error: error?.message });
		throw new AppError(500, 'Failed to update the playlist cover', 'PLAYLIST_UPDATE_ERROR');
	}
	realtime.notifyPlaylistDetails(toDetailsPayload(data));
}

/** Owner and Premium only. The previous cover file is deleted when it was stored here. */
export async function uploadCover(
	playlistId: string,
	userId: string,
	file: Buffer
): Promise<CoverResponse> {
	await checkOwnership(playlistId, userId);
	await assertPremium(userId);

	const previousUrl = await currentCoverUrl(playlistId);
	const { path, publicUrl: coverUrl } = await storeImage(COVER_BUCKET, playlistId, file, {
		label: 'cover',
		code: 'COVER_UPLOAD_ERROR',
	});

	try {
		await setCoverUrl(playlistId, coverUrl);
	} catch (error) {
		// The new file is not referenced anywhere: remove it.
		await removeStoredImage(COVER_BUCKET, path, { playlistId });
		throw error;
	}

	if (previousUrl !== coverUrl) await deleteCoverFile(previousUrl, playlistId);

	logger.info('Playlist cover updated', { playlistId, userId, path });
	return { coverUrl };
}

/** Owner only, on any plan: after a downgrade the cover stays until the owner removes it. */
export async function removeCover(playlistId: string, userId: string): Promise<CoverResponse> {
	await checkOwnership(playlistId, userId);

	const previousUrl = await currentCoverUrl(playlistId);
	await setCoverUrl(playlistId, null);
	await deleteCoverFile(previousUrl, playlistId);

	logger.info('Playlist cover removed', { playlistId, userId });
	return { coverUrl: null };
}
