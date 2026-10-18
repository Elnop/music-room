import { randomUUID } from 'node:crypto';
import { supabase } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { detectImageType } from '@/features/profile/utils/image-type.js';
import type { AvatarResponse } from '@/features/profile/profile.types.js';

/** Public Storage bucket created by migration 027. */
export const AVATAR_BUCKET = 'avatars';

const PUBLIC_PATH_PREFIX = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
const OBJECT_NAME = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

/**
 * Object path in the `avatars` bucket when `url` is a photo this backend
 * stored for `userId` (`<userId>/<uuid>.<ext>`), null otherwise: a Google or
 * Facebook picture, someone else's folder, any other URL. Only that path is
 * ever deleted. The host is not compared, since the local stack is reached
 * under several addresses; the folder restricts deletion to the user's files.
 */
export function ownedAvatarPath(url: string | null | undefined, userId: string): string | null {
	if (!url) return null;

	let path: string;
	try {
		const { pathname } = new URL(url);
		if (!pathname.startsWith(PUBLIC_PATH_PREFIX)) return null;
		path = decodeURIComponent(pathname.slice(PUBLIC_PATH_PREFIX.length));
	} catch {
		// Not a URL, or a bad percent sequence (URIError)
		return null;
	}
	const [folder, name, ...rest] = path.split('/');
	if (folder !== userId || !name || rest.length > 0 || !OBJECT_NAME.test(name)) return null;
	return path;
}

/** Best effort: a leftover file must not fail a change already saved. */
async function removeObject(path: string, userId: string): Promise<void> {
	const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);
	if (error) {
		logger.warn('Failed to delete an avatar file', { userId, path, error: error.message });
	}
}

/**
 * Deletes the photo at `previousUrl` when it is ours (see ownedAvatarPath) and
 * no longer the avatar (`currentUrl`). Never throws.
 */
export async function deleteReplacedAvatar(
	previousUrl: string | null | undefined,
	currentUrl: string | null | undefined,
	userId: string
): Promise<void> {
	if (previousUrl === currentUrl) return;
	const path = ownedAvatarPath(previousUrl, userId);
	if (!path) return;
	try {
		await removeObject(path, userId);
	} catch (error) {
		logger.warn('Failed to delete an avatar file', {
			userId,
			path,
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

export class AvatarService {
	/**
	 * Stores a new profile photo and makes it the user's avatar. The previous
	 * photo is deleted when it was stored here; an external one is left alone.
	 */
	async uploadAvatar(userId: string, file: Buffer): Promise<AvatarResponse> {
		const type = detectImageType(file);
		if (!type) {
			throw new AppError(400, 'The file is not a JPEG, PNG or WebP image', 'INVALID_IMAGE');
		}

		const previousUrl = await this.currentAvatarUrl(userId);
		const path = `${userId}/${randomUUID()}.${type.ext}`;
		const bucket = supabase.storage.from(AVATAR_BUCKET);

		const { error: uploadError } = await bucket.upload(path, file, {
			contentType: type.mime,
			cacheControl: '31536000',
			upsert: false,
		});
		if (uploadError) {
			logger.error('Avatar upload to Storage failed', { userId, error: uploadError.message });
			throw new AppError(500, 'Failed to store the photo', 'AVATAR_UPLOAD_ERROR');
		}

		const avatarUrl = bucket.getPublicUrl(path).data.publicUrl;

		try {
			await this.setAvatarUrl(userId, avatarUrl);
		} catch (error) {
			// The new file is not referenced anywhere: remove it.
			await removeObject(path, userId);
			throw error;
		}

		const previousPath = ownedAvatarPath(previousUrl, userId);
		if (previousPath && previousPath !== path) await removeObject(previousPath, userId);

		logger.info('Avatar updated', { userId, path });
		return { avatarUrl };
	}

	/** Clears the user's avatar and deletes the photo when it was stored here. */
	async removeAvatar(userId: string): Promise<AvatarResponse> {
		const previousUrl = await this.currentAvatarUrl(userId);
		await this.setAvatarUrl(userId, null);

		const previousPath = ownedAvatarPath(previousUrl, userId);
		if (previousPath) await removeObject(previousPath, userId);

		logger.info('Avatar removed', { userId });
		return { avatarUrl: null };
	}

	private async currentAvatarUrl(userId: string): Promise<string | null> {
		const { data, error } = await supabase
			.from('user_profiles')
			.select('avatar_url')
			.eq('id', userId)
			.single();
		if (error || !data) {
			throw new AppError(404, 'Profile not found', 'PROFILE_NOT_FOUND');
		}
		return data.avatar_url;
	}

	private async setAvatarUrl(userId: string, avatarUrl: string | null): Promise<void> {
		const { error } = await supabase
			.from('user_profiles')
			.update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
			.eq('id', userId);
		if (error) {
			logger.error('Failed to save avatar_url', { userId, error: error.message });
			throw new AppError(500, 'Failed to update the profile photo', 'PROFILE_UPDATE_ERROR');
		}
	}
}
