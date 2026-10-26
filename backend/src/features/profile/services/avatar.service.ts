import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import {
	removeStoredImage,
	storedImagePath,
	storeImage,
} from '@/shared/storage/public-image.js';
import type { AvatarResponse } from '@/features/profile/profile.types.js';

/** Public bucket, created by migration 027. */
export const AVATAR_BUCKET = 'avatars';

/** Only paths this backend stored for userId (`<userId>/<uuid>.<ext>`) are ever deleted. */
export function ownedAvatarPath(url: string | null | undefined, userId: string): string | null {
	return storedImagePath(url, AVATAR_BUCKET, userId);
}

/** Deletes the photo at previousUrl when it is ours and no longer the avatar. Never throws. */
export async function deleteReplacedAvatar(
	previousUrl: string | null | undefined,
	currentUrl: string | null | undefined,
	userId: string
): Promise<void> {
	if (previousUrl === currentUrl) return;
	const path = ownedAvatarPath(previousUrl, userId);
	if (path) await removeStoredImage(AVATAR_BUCKET, path, { userId });
}

async function currentAvatarUrl(userId: string): Promise<string | null> {
	const { data, error } = await supabaseAdmin
		.from('user_profiles')
		.select('avatar_url')
		.eq('id', userId)
		.single();
	if (error || !data) {
		throw new AppError(404, 'Profile not found', 'PROFILE_NOT_FOUND');
	}
	return data.avatar_url;
}

async function setAvatarUrl(userId: string, avatarUrl: string | null): Promise<void> {
	const { error } = await supabaseAdmin
		.from('user_profiles')
		.update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
		.eq('id', userId);
	if (error) {
		logger.error('Failed to save avatar_url', { userId, error: error.message });
		throw new AppError(500, 'Failed to update the profile photo', 'PROFILE_UPDATE_ERROR');
	}
}

/** The previous photo is deleted when it was stored here; an external one is left alone. */
export async function uploadAvatar(userId: string, file: Buffer): Promise<AvatarResponse> {
	const previousUrl = await currentAvatarUrl(userId);
	const { path, publicUrl: avatarUrl } = await storeImage(AVATAR_BUCKET, userId, file, {
		label: 'photo',
		code: 'AVATAR_UPLOAD_ERROR',
	});

	try {
		await setAvatarUrl(userId, avatarUrl);
	} catch (error) {
		// The new file is not referenced anywhere: remove it.
		await removeStoredImage(AVATAR_BUCKET, path, { userId });
		throw error;
	}

	await deleteReplacedAvatar(previousUrl, avatarUrl, userId);

	logger.info('Avatar updated', { userId, path });
	return { avatarUrl };
}

/** Also deletes the photo when it was stored here. */
export async function removeAvatar(userId: string): Promise<AvatarResponse> {
	const previousUrl = await currentAvatarUrl(userId);
	await setAvatarUrl(userId, null);
	await deleteReplacedAvatar(previousUrl, null, userId);

	logger.info('Avatar removed', { userId });
	return { avatarUrl: null };
}
