import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { AppError } from '@/shared/middleware/error-handler.js';

/** Largest profile photo accepted, also the `avatars` bucket's limit (migration 027). */
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** Multipart field that carries the photo. */
const AVATAR_FIELD = 'avatar';

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: AVATAR_MAX_BYTES, files: 1, fields: 0 },
}).single(AVATAR_FIELD);

/**
 * Reads the `avatar` file of a multipart body into memory (`req.file`).
 * Multer's errors become AppErrors: over 2 MB is 413 FILE_TOO_LARGE, any other
 * malformed upload 400 INVALID_UPLOAD. The type is checked later, from the
 * file's bytes.
 */
export function avatarUpload(req: Request, res: Response, next: NextFunction): void {
	upload(req, res, (error: unknown) => {
		if (!error) {
			next();
			return;
		}
		if (error instanceof multer.MulterError) {
			if (error.code === 'LIMIT_FILE_SIZE') {
				next(new AppError(413, 'The photo must not exceed 2 MB', 'FILE_TOO_LARGE'));
				return;
			}
			next(new AppError(400, `Invalid upload: ${error.message}`, 'INVALID_UPLOAD'));
			return;
		}
		next(
			new AppError(400, 'Invalid upload: the body must be multipart/form-data', 'INVALID_UPLOAD')
		);
	});
}
