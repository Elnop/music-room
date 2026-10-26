import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { detectImageType } from '@/shared/storage/image-type.js';

// Images in a public bucket, written only by the backend as `<folder>/<uuid>.<ext>`.

const OBJECT_NAME = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

// The host is not compared, as the local stack has several addresses: the folder restricts deletion.
/** The object path when `url` is a file this backend stored in `bucket` under `folder`, else null. */
export function storedImagePath(
	url: string | null | undefined,
	bucket: string,
	folder: string
): string | null {
	if (!url) return null;

	const prefix = `/storage/v1/object/public/${bucket}/`;
	let path: string;
	try {
		const { pathname } = new URL(url);
		if (!pathname.startsWith(prefix)) return null;
		path = decodeURIComponent(pathname.slice(prefix.length));
	} catch {
		// Not a URL, or a bad percent sequence (URIError)
		return null;
	}
	const [first, name, ...rest] = path.split('/');
	if (first !== folder || !name || rest.length > 0 || !OBJECT_NAME.test(name)) return null;
	return path;
}

/** Best effort: a leftover file must not fail a change already saved. Never throws. */
export async function removeStoredImage(
	bucket: string,
	path: string,
	logFields: Record<string, unknown>
): Promise<void> {
	try {
		const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
		if (error) logger.warn('Failed to delete a stored image', { bucket, path, ...logFields, error });
	} catch (error) {
		logger.warn('Failed to delete a stored image', {
			bucket,
			path,
			...logFields,
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

/** Checks the type from the bytes (400 INVALID_IMAGE), then stores the file under a random name. */
export async function storeImage(
	bucket: string,
	folder: string,
	file: Buffer,
	failure: { label: string; code: string }
): Promise<{ path: string; publicUrl: string }> {
	const type = detectImageType(file);
	if (!type) {
		throw new AppError(400, 'The file is not a JPEG, PNG or WebP image', 'INVALID_IMAGE');
	}

	const path = `${folder}/${randomUUID()}.${type.ext}`;
	const storage = supabaseAdmin.storage.from(bucket);
	const { error } = await storage.upload(path, file, {
		contentType: type.mime,
		cacheControl: '31536000',
		upsert: false,
	});
	if (error) {
		logger.error('Image upload to Storage failed', { bucket, folder, error: error.message });
		throw new AppError(500, `Failed to store the ${failure.label}`, failure.code);
	}

	return { path, publicUrl: storage.getPublicUrl(path).data.publicUrl };
}
